<template>
  <div>
    <p
      :class="['text-fg-secondary mb-1', props.error ? 'text-fg-red' : null]"
      v-if="props.label">
      {{ props.label }}
    </p>

    <Dropdown
      theme="ui-select-dropdown"
      placement="bottom-start"
      auto-size>
      <div
        class="w-full relative"
        :class="{ 'pointer-events-none': props.disabled || isLoading }">
        <div
          class="ui-select__disabled"
          v-if="props.disabled || isLoading"></div>

        <!--    Select -->
        <div
          :class="{
            'ui-select': true,
            error: !!props.error,
            'ui-select--s': props.size === 's',
            'ui-select--m': props.size === 'm',
          }"
          tabindex="0">
          <slot name="selectedValueContainer">
            <span
              class="text-fg-tertiary"
              v-if="!isShowPlaceholder"
            >{{ props.placeholder ?? "Select value" }}</span
            >

            <!--      if multiple value -->

            <div
              v-if="
                props.multiple &&
                Array.isArray(selectedValue) &&
                selectedValue.length > 0 &&
                props.options
              "
              class="w-[90%] flex items-center flex-wrap gap-2">
              <div
                v-for="item in selectedValue"
                :key="item">
                <slot
                  name="selectedOption"
                  :option="findOption(item)"
                  :deleteOption="deleteOptionHandler">
                  <div
                    class="bg-bg-tether px-2 rounded gap-0.5 flex items-center ui-select__selected-multiple-option">
                    {{ displayOptionLabel(item) }}
                    <DynamicIcon
                      name="close"
                      @click.stop="deleteOptionHandler(item)"
                      class="w-4 cursor-pointer text-fg-primary" />
                  </div>
                </slot>
              </div>
            </div>

            <!--      if single value -->
            <div
              class="w-[90%]"
              v-if="
                !props.multiple &&
                !Array.isArray(selectedValue) &&
                selectedValue &&
                props.options
              ">
              <slot
                name="selectedOption"
                :option="findOption(selectedValue)">
                <div
                  class="text-ellipsis overflow-hidden w-full whitespace-nowrap">
                  {{ displayOptionLabel(selectedValue) }}
                </div>
              </slot>
            </div>
          </slot>

          <!--        clear icon -->
          <DynamicIcon
            v-if="props.cleared"
            name="close"
            class="w-5 absolute right-6 text-fg-secondary"
            v-show="isShowClearSelectIcon"
            @click.stop="clearSelectHandler" />

          <DynamicIcon
            name="chevron-down"
            class="w-4 h-auto transition-transform absolute right-1 text-fg-primary"
            :class="{ 'rotate-180': isShowOptionsList }" />
        </div>
        <!--    Select end -->
      </div>

      <!--    Options -->
      <template #popper="{ hide }">
        <div class="ui-select__list">
          <!--        search-->
          <div
            class="px-2 py-2"
            v-if="props.searchable">
            <UITextInput
              v-if="props.searchable && !props.remoteSearch"
              type="search"
              v-model="inputSearch"
              placeholder="Search" />

            <UITextInput
              v-if="props.searchable && props.remoteSearch"
              type="search"
              :debounce="300"
              v-model="inputSearchRemote"
              placeholder="Search" />
          </div>

          <Simplebar class="max-h-[250px]">
            <!--        loader -->
            <div v-if="props.isLoading">
              <Skeletor
                v-for="(i, idx) in 4"
                :key="idx"
                class="rounded mb-2 mx-2"
                height="25"></Skeletor>
            </div>

            <!--  simple options -->
            <div v-else-if="!props.grouping && !props.isLoading">
              <ul class="flex flex-col gap-2 items-stretch">
                <li
                  class=""
                  v-for="(item, idx) in optionsSimple"
                  :key="idx"
                  @click="changeSelectHandler(item, hide)">
                  <slot
                    name="option"
                    :option="item">
                    <div
                      class="ui-select__list__item"
                      :class="{
                        'bg-bg-none-clicked': selectedValueEqual(item.value),
                      }">
                      <span class="text-ellipsis overflow-x-hidden">{{
                          item?.label
                        }}</span>
                    </div>
                  </slot>
                </li>
              </ul>
            </div>

            <!--  grouped options-->
            <div v-else>
              <div
                v-for="(value, key) in optionsGrouped"
                :key="key">
                <div class="bg-bg-level-2 px-4 py-1">
                  <p class="uppercase text-sm text-fg-primary">{{ key }}</p>
                </div>
                <ul class="flex flex-col items-stretch gap-2 mt-2">
                  <li
                    v-for="(item, idx) in value"
                    @click="changeSelectHandler(item, hide)"
                    :key="idx">
                    <slot
                      name="option"
                      :option="item"
                    ><div
                      class="ui-select__list__item"
                      :class="{
                          'bg-bg-none-clicked': selectedValueEqual(item.value),
                        }">
                      {{ item?.label }}
                    </div></slot
                    >
                  </li>
                </ul>
              </div>
            </div>

            <!--        not found options-->
            <div
              v-if="isNotFoundOptions"
              class="p-3 text-center text-fg-secondary">
              Not found
            </div>

            <!--          observer target-->
            <div ref="optionsEndTarget"></div>
          </Simplebar>
        </div>
      </template>
    </Dropdown>

    <p
      v-if="props.error || props.helperText"
      class="text-sm mt-1"
      :class="[props.error ? 'text-core-red-500 ' : 'text-fg-primary']">
      {{ props.error ?? props.helperText }}
    </p>
  </div>
</template>

<script setup lang="ts" generic="T">
import { Dropdown } from "floating-vue";
import { Skeletor } from "vue-skeletor";
import { ref, computed } from "vue";
import { useIntersectionObserver } from "@vueuse/core";
import DynamicIcon from "@/components/icons/DynamicIcon.vue";
import UITextInput from "@/components/ui/UITextInput/UITextInput.vue";
import Simplebar from "simplebar-vue";

export type TUISelectOption<T = unknown> = {
  label: string;
  value: string | number;
  groupName?: string;
} & T;

export type TUISelectProps = {
  options: TUISelectOption[];
  size?: "s" | "m";
  multiple?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  cleared?: boolean;
  label?: string;
  helperText?: string;
  grouping?: boolean;
  remoteSearch?: boolean;
  checkedOption?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  error?: string;
};


const props = withDefaults(defineProps<TUISelectProps>(), {
  size: "s",
  cleared: true,
});

const emit = defineEmits<{
  optionsEndIntersection: [value: boolean];
  clearSelectedValue: [];
}>();

const selectedValueEqual = (value: number | string): boolean => {
  if (Array.isArray(selectedValue.value)) {
    return selectedValue.value.some((item) => item == value);
  } else {
    return selectedValue.value == value;
  }
};

const findOption = (v: string | number) => {
  return props.options.find((el) => el.value == v);
};

const addSelectedValue = (value: string | number) => {
  if (Array.isArray(selectedValue.value) && selectedValue.value) {
    (selectedValue.value as Array<string | number>).push(value);
  } else {
    selectedValue.value = value;
  }
};

defineSlots<{
  selectedOption(slotProps: {
    option?: TUISelectOption;
    deleteOption?: (value: string) => any;
  }): any;
  option(slotProps: { option: TUISelectOption }): any;
  selectedValueContainer(props: any): any;
}>();

const displayOptionLabel = (v: string | number) => {
  const opt = props.options.find((el) => el.value == v);

  if (!opt) {
    return v;
  } else {
    return opt?.label;
  }
};

const selectedValue = defineModel<
  Array<string | number> | string | number | null
>({
  default: [],
});

const isShowOptionsList = ref(false);
const optionsEndTarget = ref(null);
const isOptionsEndIntersection = ref(false);

useIntersectionObserver(
  optionsEndTarget,
  ([{ isIntersecting }]) => {
    isOptionsEndIntersection.value = isIntersecting;
    emit("optionsEndIntersection", isOptionsEndIntersection.value);
  }
);

const optionsSimple = computed(() => {
  if (inputSearch.value) {
    return optionsListSearch.value;
  } else {
    return props.options;
  }
});

const optionsGrouped = computed(() => {
  if (inputSearch.value) {
    return optionsListGroupedSearch.value;
  } else {
    return optionsListGrouped.value;
  }
});

const isNotFoundOptions = computed(() => {
  return Boolean(
    (inputSearch.value && Object.keys(optionsListGroupedSearch).length === 0) ||
    (inputSearch.value && optionsListSearch.value.length === 0) ||
    (props.options.length === 0 && inputSearchRemote.value)
  );
});

const changeSelectHandler = (option: TUISelectOption, hide: () => void) => {
  if (props.multiple && Array.isArray(selectedValue.value)) {
    if (selectedValueEqual(option.value)) {
      if (props.checkedOption) {
        selectedValue.value = selectedValue.value?.filter(
          (el) => el != option.value
        );
        return;
      } else {
        hide();
        return;
      }
    }

    addSelectedValue(option.value);

    if (props.checkedOption) {
      return;
    }
    hide();
    inputSearch.value = "";
    inputSearchRemote.value = "";
  } else {
    if (selectedValue.value == option?.value) {
      hide();
      return;
    }

    hide();
    inputSearch.value = "";
    inputSearchRemote.value = "";
    addSelectedValue(option.value);
  }
};

const deleteOptionHandler = (value: string | number) => {
  if (props.multiple) {
    selectedValue.value = (
      selectedValue.value as Array<string | number>
    )?.filter((el) => el != value);
  }
};

const inputSearch = ref<string>("");
const inputSearchRemote = defineModel<string>("remoteSearchValue");

const optionsListSearch = computed(() => {
  const reg = new RegExp(`${inputSearch.value}`, "ig");

  return props.options.filter((item: TUISelectOption) => {
    return reg.test(item?.label);
  });
});

const isShowPlaceholder = computed(() => {
  if (Array.isArray(selectedValue.value)) {
    return Boolean(selectedValue.value.length);
  } else {
    return Boolean(selectedValue.value);
  }
});

const optionsListGroupedSearch = computed(() => {
  return groupBy(optionsListSearch.value, "groupName");
});

const groupBy = (items: any, key: "groupName") =>
  items.reduce((result: any, item: any) => {
    return {
      ...result,
      [item[key]]: [...(result[item[key]] || []), item],
    };
  }, {});

const optionsListGrouped = computed(() => {
  return groupBy(props.options, "groupName");
});

const clearSelectHandler = () => {
  if (props.multiple) {
    selectedValue.value = [];
    isShowOptionsList.value = false;
  } else {
    selectedValue.value = "";
    isShowOptionsList.value = false;
  }
  emit("clearSelectedValue");
};

const isShowClearSelectIcon = computed(() => {
  if (Array.isArray(selectedValue.value)) {
    return Boolean(selectedValue.value.length);
  } else {
    return Boolean(selectedValue.value);
  }
});
</script>

<style>
.ui-select {
  @apply relative box-border border border-bg-level-2 px-2 py-0.5 flex items-center justify-between
  flex-wrap gap-1 rounded cursor-pointer bg-bg-level-0 transition-all focus:border-fg-primary
  focus-visible:border-fg-primary hover:border-fg-secondary;
}

.ui-select__disabled {
  @apply absolute w-full h-full top-0 left-0 bg-bg-level-1 opacity-50 z-50;
}

.ui-select--m {
  @apply min-h-11;
}

.ui-select--s {
  @apply min-h-8;
}

.ui-select__list__item {
  @apply transition-colors hover:bg-bg-none-hover px-2 py-1 cursor-pointer text-fg-primary rounded
  h-8 flex items-center justify-start;
}

.ui-select.error {
  @apply border-fg-red;
}

</style>
<template>
  <el-table-column
    v-for="(column, index) in columns"
    :key="`${index}-${column.prop}`"
    :type="column.type"
    :width="column.width"
    :min-width="column.minWidth"
    :align="column.align"
    :label="column.headerName"
    :column-key="column.prop"
    :prop="column.prop"
    :fixed="column.fixed"
    :filters="column.filters"
    :filter-multiple="column.filterMultiple"
    :filtered-value="column.filteredValue"
    :show-overflow-tooltip="column.showOverflowTooltip"
    :render-header="column.renderHeader"
    :sortable="column.sortable"
  >
    <template v-if="column.children && column.children.length > 0">
      <LevelColumn
        v-for="(childColumn, childIndex) in column.children"
        :key="`${childIndex}-${childColumn.prop}`"
        :column="childColumn"
      />
    </template>

    <template v-if="!column.children" slot-scope="scope">
      <span v-if="column.render">
        <ExpandSlot
          :render="column.render"
          :row="scope.row"
          :index="scope.$index"
        />
      </span>
      <span v-else-if="column.formatter">
        {{
          column.formatter(
            scope.row,
            scope.column,
            scope.row[column.prop],
            scope.$index
          )
        }}
      </span>
      <span v-else>
        {{ scope.row[column.prop] }}
      </span>
    </template>
  </el-table-column>
</template>
<script>
import ExpandSlot from './expand-slot.vue'
export default {
  name: 'LevelColumn',
  components: { ExpandSlot },
  props: {
    columns: {
      type: Object
    }
  },
  data() {
    return {}
  }
}
</script>

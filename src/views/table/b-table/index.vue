<template>
  <div style="border: 1px solid #e0e0e0">
    <div v-if="bShowTool" class="table-tool">
      <slot name="tool" />
    </div>
    <el-table ref="refTable" v-bind="attrs" v-on="listeners">
      <el-table-column v-if="bShowExpand" type="expand" />
      <el-table-column
        v-if="bShowSelection"
        type="selection"
        width="35px"
        :reserve-selection="true"
        :selectable="selectable"
      />
      <el-table-column
        v-if="bShowIndex"
        type="index"
        :index="getIndex"
        :show-overflow-tooltip="true"
      >
        <template slot="header">#</template>
      </el-table-column>
      <LevelColumn
        v-for="(column, index) in column"
        :key="`${index}-${column.prop}`"
        :column="column"
      />
    </el-table>
    <el-row v-if="bShowPage">
      <slot name="footer" />
      <el-pagination
        class="table-pagination"
        :small="bPageSmall"
        :layout="layout"
        :total="curTotal"
        :page-sizes="pageSizes"
        :page-size.sync="curPageSize"
        :current-page.sync="curPage"
      />
    </el-row>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash-es'
import LevelColumn from './level-column.vue'
import { setLocalStore, getLocalStore, createSortFunc } from '.'

export default {
  name: 'BTable',
  components: {
    LevelColumn
  },
  inheritAttrs: false,
  props: {
    bShowTool: {
      type: Boolean,
      default: true
    },
    bShowExpand: {
      type: Boolean,
      default: false
    },
    bShowSelection: {
      type: Boolean,
      default: true
    },
    selectable: {
      type: Function,
      default: () => {
        return true
      }
    },
    bShowIndex: {
      type: Boolean,
      default: false
    },
    bShowPage: {
      type: Boolean,
      default: true
    },
    // 搜索时，支持哪些列可以搜索
    searchkeys: Array,
    // 搜索词
    searchValue: String,
    // 前端分页时的所有数据
    allData: {
      type: Array,
      default: () => []
    },
    data: Array,
    columns: Array,
    maxHeight: [Number, String],
    bMaxHeight: {
      type: Boolean,
      default: true
    },
    rowkey: {
      type: [Function, String],
      default: row => {
        return row.id
      }
    },
    treeProps: {
      type: Object,
      default() {
        return {
          children: 'children',
          hasChildren: 'has_children'
        }
      }
    },
    fixed: {
      type: Boolean,
      default: true
    },
    pageStoreKey: {
      type: String,
      default: 'PAGE_SIZE'
    },
    total: {
      type: Number,
      default: 0
    },
    pageSize: Number,
    currentPage: {
      type: Number,
      default: 1
    },
    bPageSmall: Boolean,
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    pageSizes: {
      type: Array,
      default: () => [5, 10, 50, 100]
    },
    filterKeys: Object
  },

  data() {
    return {
      curPageSize: this.initPageSize(),
      curPage: this.currentPage,
      curData: [],
      curTotal: 0,
      filters: this.filterKeys || '',
      orderType: '',
      orderProp: '',
      headerCellStyle: {
        height: '38px',
        'font-weight': 600,
        color: '#333333',
        padding: '0',
        'background-color': '#E8EFF8'
      },
      cellStyle: {
        height: '38px',
        padding: '0'
      }
    }
  },

  computed: {
    attrs() {
      let attrs = {
        ...this.$attrs,
        data: this.curData,
        'row-key': this.rowkey,
        stripe: true,
        fixed: this.fixed,
        'tooltip-effect': 'light',
        'header-cell-style': this.headerCellStyle,
        'cell-style': this.cellStyle,
        'tree-props': this.treeProps
      }
      if (this.bMaxHeight) {
        attrs = {
          ...attrs,
          'max-height': this.maxHeight || this._maxHeight
        }
      }
      return attrs
    },

    listeners() {
      const listeners = {
        ...this.$listeners,
        'sort-change': this.handleSortChange,
        'filter-change': this.handleFilterChange
      }
      return listeners
    },

    // 前端自己分页
    bLocalPage() {
      return this.allData.length > 0
    }
  },

  watch: {
    data: {
      immediate: true,
      handler() {
        this.curData = this.data
        this.curTotal = this.total
      }
    },
    allData() {
      this.getCurData()
    },

    curPage(val) {
      this.getCurData()
      this.$emit('update:currentPage', val)
    },
    currentPage(val) {
      this.curPage = val
    },
    curPageSize(val) {
      this.getCurData()
      setLocalStore(this.pageStoreKey, val)
      this.$emit('update:pageSize', val)
      this.$emit('size-change', val)
    }
  },

  mounted() {
    window.addEventListener('resize', this.getTableHeight)
    this.getTableHeight()
  },

  destroyed() {
    window.removeEventListener('resize', this.getTableHeight)
  },

  methods: {
    initPageSize() {
      let size = 10
      if (this.pageSize) {
        size = this.pageSize
      } else {
        size = getLocalStore(this.pageStoreKey, 10)
      }
      setLocalStore(this.pageStoreKey, size)
      return size
    },

    getIndex(index) {
      return (this.curPage - 1) * this.curPageSize + index + 1
    },

    getTableHeight() {
      this._maxHeight = this.maxHeight || window.innerHeight - 250
    },

    handleSortChange({ prop, order }) {
      let orderKey = ''
      if (order) {
        if (order === 'ascending') {
          orderKey = prop
        } else {
          orderKey = `-${prop}`
        }
      }
      this.orderProp = prop
      this.orderType = order
      this.getCurData()
      this.$emit('on-sort', orderKey, prop, order)
    },

    handleFilterChange(filters) {
      let exist = false
      const filterKey = Object.keys(filters)[0]
      if (!this.filters) {
        this.filters = filters
      } else {
        for (const key in this.filters) {
          if (key === filterKey) {
            exist = true
            this.filters[key] = filters[key]
          }
        }
        if (!exist) {
          this.filters[filterKey] = filters[filterKey]
        }
      }
      this.getCurData()
      this.$emit('on-filter', this.filters)
    },

    toggleRowSelection(row, selected) {
      if (!this.bLocalPage) {
        // 选中\取消状态，row必须为当前的data的数据，
        // row又是引用类型的数据，element ui源码是用statusArr.indexOf(row)，所以当界面数据数据后，会找不到数据。
        for (const rowData of this.$refs.refTable.selection) {
          if (rowData.id === row.id) {
            row = rowData
            break
          }
        }
      }
      this.$refs.refTable.toggleRowSelection(row, selected)
    },

    doClearSelectedData() {
      this.$refs.refTable.clearSelection()
    },

    getStoreData() {
      return this.$refs.refTable.store
    },

    getCurData() {
      if (!this.bLocalPage) return
      let data = cloneDeep(this.allData)
      if (this.filters) {
        Object.keys(this.filters).forEach(colName => {
          data = data.filter(item => {
            return (
              !this.filters[colName].length ||
            this.filters[colName].includes(item[colName])
            )
          })
        })
      }

      if (this.searchValue) {
        const value = this.searchValue.toLowerCase()
        data = data.filter(item => {
          let bFind = false
          this.searchkeys.forEach(key => {
            bFind =
            bFind || String(item[key]).toLowerCase().indexOf(value) !== -1
          })
          return bFind
        })
      }

      if (this.orderType) {
        data.sort(createSortFunc(this.orderProp, this.orderType))
      }

      this.curTotal = data.length
      if (this.bShowPage) {
        // 支持分页
        this.curData = data.slice(
          (this.curPage - 1) * this.curPageSize,
          this.curPage * this.curPageSize
        )
      } else {
        this.curData = data
      }
    }
  }
}
</script>
<style lang="scss">
.table-tool {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  line-height: 22px;
  padding: 0 16px;
}
.el-table {
  font-size: 13px;
}
.table-pagination {
  float: right;
  padding: 10px;
  min-height: 48px;
}
</style>

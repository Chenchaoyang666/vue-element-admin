/**
 * 根据数组的某项进行排序
 * key: 第几项或者某个字段名
 * order: ascending或descending
 */
Common.createSortFunc = (key, order = 'ascending') => {
  return function(a, b) {
    let av = a[key]
    let bv = b[key]

    if (!isNaN(Number(av)) && !isNaN(Number(bv))) {
      av = Number(av)
      bv = Number(bv)
    }

    if (order === 'ascending') {
      if (av === null) {
        return -1
      } else if (bv === null) {
        return 1
      }
      return av > bv ? 1 : -1
    } else if (order === 'descending') {
      if (av === null) {
        return 1
      } else if (bv === null) {
        return -1
      }
      return av < bv ? 1 : -1
    } else {
      return 0
    }
  }
}

/**
   * 浏览器本地数据读写接口
   */
export function getLocalStore(key, defval = null) {
  if (localStorage.hasOwnProperty(key)) {
    try {
      return JSON.parse(localStorage.getItem(key))
    } catch (e) {
      console.log(e)
      return localStorage.getItem(key)
    }
  }
  return defval
}

export function setLocalStore(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

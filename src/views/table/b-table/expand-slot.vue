<script>
export default {
  name: 'ExpandSlot',
  props: {
    row: {
      type: Object
    },
    index: {
      type: Number
    },
    render: {
      type: Function
    }
  },
  data() {
    return {
    }
  },
  render: (h, context) => {
    return context.props.render(h, context.props)
  }
}
</script>

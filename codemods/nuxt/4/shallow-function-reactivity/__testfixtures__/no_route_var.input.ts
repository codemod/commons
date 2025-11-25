// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
const { data } = useAsyncData(() => getContinuousKLines(symbol.value, interval.value), {
  immediate: false,
  default: () => [] satisfies Array<WSContinuousKLineDataK>,
  watch: [symbol, interval],
}); 
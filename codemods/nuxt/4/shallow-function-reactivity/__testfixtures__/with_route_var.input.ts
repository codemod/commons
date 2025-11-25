// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
const route = useRoute();
const { data } = useAsyncData(() => getContinuousKLines(route.params.slug, interval.value), {
  immediate: false,
  default: () => [] satisfies Array<WSContinuousKLineDataK>,
  watch: [route, interval],
}); 
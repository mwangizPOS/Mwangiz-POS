type DuplicateValue<
  TValues extends readonly string[],
  TSeen extends string = never,
> = TValues extends readonly [
  infer THead extends string,
  ...infer TTail extends readonly string[],
]
  ? THead extends TSeen
    ? THead | DuplicateValue<TTail, TSeen>
    : DuplicateValue<TTail, TSeen | THead>
  : never

type UniqueRegistryValues<TValues extends readonly string[]> =
  DuplicateValue<TValues> extends never
    ? unknown
    : {
        readonly __duplicate_registry_value__: DuplicateValue<TValues>
      }

export function defineUniqueRegistryValues<const TValues extends readonly string[]>(
  values: TValues & UniqueRegistryValues<TValues>,
) {
  return values
}

export type RegistryValues<TRegistry extends Record<string, string>> =
  TRegistry[keyof TRegistry]

export type AssertRegistryValuesUnique<TValues extends readonly string[]> =
  UniqueRegistryValues<TValues>

export function cn(
  ...inputs: (string | undefined | null | boolean | { [key: string]: any })[]
) {
  return inputs
    .flatMap((input) => {
      if (typeof input === "string") return input;
      if (typeof input === "object" && input !== null) {
        return Object.entries(input)
          .filter(([_, value]) => !!value)
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");
}

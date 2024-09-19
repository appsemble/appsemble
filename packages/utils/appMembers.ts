export function assignAppMemberProperties(properties: any, formData: FormData): void {
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    formData.append(
      'properties',
      JSON.stringify(
        Object.fromEntries(
          Object.entries(properties).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ]),
        ),
      ),
    );
  }
}

export const RegExpUnion = (...re: RegExp[]) =>
	new RegExp(
		re.map((r) => r.source).join("|"),
	)

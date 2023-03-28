import plugin from 'tailwindcss/plugin'

export = plugin(
  function containerQueries({ matchUtilities, matchVariant, theme }) {
    let values: Record<string, string> = theme('containers') ?? {}

    function removeBraces(value: string): string {
      let matched = value.match(/^\((?<body>.+)\)$/)
      let { body } = matched?.groups ?? {}
      return body ?? ""
    }

    function extractCondition(raw: string): string | null {
      if (raw.startsWith("(")) return extractCondition(removeBraces(raw));

      let matched = raw.match(/^((?<property>.+):)?(?<value>(\d+\.\d+|\d+|\.\d+)\D+)$/)
      let { property, value } = matched?.groups ?? {}
      if (value === undefined) return null

      let isInvalid = Number.isNaN(Number.parseFloat(value))
      if (isInvalid) return null

      return `(${property ?? 'min-width'}: ${value})`
    }

    function extractConditions(raw: string): string | null {
      if (!raw.includes("_and_")) return extractCondition(raw)

      const extractedConditions = raw.split("_and_").flatMap((condition) => {
        let matched = condition.match(/^\((?<body>.+)\)$/)
        let { body } = matched?.groups ?? {}
        if (body === undefined) return []

        const extracted = extractCondition(body)
        if (extracted === null) return []

        return [extracted]
      })

      if (extractedConditions.length === 0) return null

      return extractedConditions.join(' and ')
    }

    matchUtilities(
      {
        '@container': (value, { modifier }) => {
          return {
            'container-type': value,
            'container-name': modifier,
          }
        },
      },
      {
        values: {
          DEFAULT: 'inline-size',
          size: 'size',
          normal: 'normal',
        },
        modifiers: 'any',
      }
    )

    matchVariant(
      '@',
      (value = '', { modifier }) => {
        let conditions = extractConditions(value)
        if (conditions === null) return []

        return `@container ${modifier ?? ''} ${conditions}`
      },
      {
        values,
        sort(aVariant, zVariant) {
          let a = parseFloat(aVariant.value)
          let z = parseFloat(zVariant.value)

          if (a === null || z === null) return 0

          // Sort values themselves regardless of unit
          if (a - z !== 0) return a - z

          let aLabel = aVariant.modifier ?? ''
          let zLabel = zVariant.modifier ?? ''

          // Explicitly move empty labels to the end
          if (aLabel === '' && zLabel !== '') {
            return 1
          } else if (aLabel !== '' && zLabel === '') {
            return -1
          }

          // Sort labels alphabetically in the English locale
          // We are intentionally overriding the locale because we do not want the sort to
          // be affected by the machine's locale (be it a developer or CI environment)
          return aLabel.localeCompare(zLabel, 'en', { numeric: true })
        },
      }
    )
  },
  {
    theme: {
      containers: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
    },
  }
)

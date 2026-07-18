'use client'

import { FieldLabel, ReactSelect, useField } from '@payloadcms/ui'
import React, { useCallback, useId, useMemo } from 'react'

type Option = {
  label: string
  value: string
}

type Props = {
  field: {
    required?: boolean
  }
  label: string
  options: Option[]
  path: string
}

export const OptionsSelect: React.FC<Props> = ({ field: { required }, label, options, path }) => {
  const { setValue, value } = useField<string[]>({
    path,
  })
  const id = useId()

  const selectedValue = useMemo(() => {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return undefined
    }

    return options.find((option) => value.find((item) => item === option.value))
  }, [options, value])

  const handleChange = useCallback(
    (newValue: Option | Option[] | null) => {
      const option = Array.isArray(newValue) ? newValue[0] : newValue
      if (!option) return

      const currentValues = Array.isArray(value) ? value : []

      if (selectedValue) {
        let selectedValueIndex = -1
        const valuesWithoutSelected = currentValues.filter((item, index) => {
          if (item === selectedValue.value) {
            selectedValueIndex = index
            return false
          }
          return true
        })

        const newValues = [...valuesWithoutSelected]
        newValues.splice(selectedValueIndex, 0, option.value)
        setValue(newValues)
      } else {
        setValue([...currentValues, option.value])
      }
    },
    [selectedValue, setValue, value],
  )

  return (
    <div className="variantOptionsSelectorItem">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <ReactSelect
        inputId={id}
        onChange={handleChange as React.ComponentProps<typeof ReactSelect>['onChange']}
        options={options}
        value={selectedValue}
      />
    </div>
  )
}

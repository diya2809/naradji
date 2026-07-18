import { FieldLabel } from '@payloadcms/ui'
import type { VariantOption, VariantType } from '@/payload-types'
import { filterVariantOptionDocs } from '@/utilities/filterVariantOptionDocs'
import type { FieldServerComponent } from 'payload'

import { ErrorBox } from './ErrorBox'
import { OptionsSelect } from './OptionsSelect'
import './index.css'

type VariantTypeWithOptions = VariantType & {
  options?: {
    docs?: Array<VariantOption | string | null>
  }
}

// findByID + select narrows joins/relationships to `{}`, so describe the shape we read.
type ProductForVariants = {
  variants?: { docs?: Array<{ options?: unknown } | string | null> } | null
  variantTypes?: Array<VariantType | string> | null
}

export const VariantOptionsSelector: FieldServerComponent = async (props) => {
  const { clientField, data, field, path, req, user } = props
  const label =
    'label' in clientField ? (clientField.label as Parameters<typeof FieldLabel>[0]['label']) : undefined
  const required = 'required' in clientField ? Boolean(clientField.required) : false
  const fieldPath = String(path)

  const productsSlug = field.custom?.productsSlug || 'products'
  const variantTypesSlug = field.custom?.variantTypesSlug || 'variantTypes'

  const product = (await req.payload.findByID({
    id: data.product,
    collection: productsSlug,
    depth: 0,
    draft: true,
    select: {
      variants: true,
      variantTypes: true,
    },
    user,
  })) as unknown as ProductForVariants

  const existingVariantOptions =
    product.variants?.docs
      ?.map((variant) => (variant && typeof variant === 'object' ? variant.options : undefined))
      .filter(Boolean) ?? []

  const variantTypeIDs = product.variantTypes
  const variantTypes: VariantTypeWithOptions[] = []

  if (variantTypeIDs?.length) {
    for (const variantTypeID of variantTypeIDs) {
      const id = typeof variantTypeID === 'object' ? variantTypeID.id : variantTypeID
      if (!id) continue

      const variantType = await req.payload.findByID({
        id,
        collection: variantTypesSlug,
        depth: 1,
        joins: {
          options: {
            sort: 'value',
          },
        },
      })

      if (variantType) {
        variantTypes.push(variantType as VariantTypeWithOptions)
      }
    }
  }

  return (
    <div className="variantOptionsSelector">
      <div className="variantOptionsSelectorHeading">
        <FieldLabel as="span" label={label} />
      </div>
      <ErrorBox existingOptions={existingVariantOptions} path={fieldPath}>
        <div className="variantOptionsSelectorList">
          {variantTypes.map((type) => {
            const options = filterVariantOptionDocs(type.options?.docs).map((option) => ({
              label: option.label,
              value: option.id,
            }))

            return (
              <OptionsSelect
                field={{ required }}
                key={type.id}
                label={type.label || type.name}
                options={options}
                path={fieldPath}
              />
            )
          })}
        </div>
      </ErrorBox>
    </div>
  )
}

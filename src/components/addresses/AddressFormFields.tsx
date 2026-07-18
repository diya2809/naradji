'use client'

import { FormItem } from '@/components/forms/FormItem'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AddressFormValues } from '@/ecommerce/addressForm'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

type Props = {
  errors: FieldErrors<AddressFormValues>
  register: UseFormRegister<AddressFormValues>
}

export function AddressFormFields({ register }: Props) {
  const inputClass =
    'border-primary bg-background/50 hover:border-primary hover:bg-background/50 focus-visible:border-primary focus-visible:ring-primary/20'

  return (
    <div className="grid gap-4">
      <FormItem>
        <Label htmlFor="name">Full name</Label>
        <Input
          autoComplete="name"
          id="name"
          className={inputClass}
          {...register('name')}
        />
      </FormItem>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            autoComplete="tel"
            id="phone"
            inputMode="tel"
            type="tel"
            className={inputClass}
            {...register('phone')}
          />
        </FormItem>

        <FormItem>
          <Label htmlFor="alternatePhone">Alternate phone</Label>
          <Input
            autoComplete="tel"
            id="alternatePhone"
            inputMode="tel"
            type="tel"
            className={inputClass}
            {...register('alternatePhone')}
          />
        </FormItem>
      </div>

      <FormItem>
        <Label htmlFor="addressLine1">Flat, house no.</Label>
        <Input
          autoComplete="address-line1"
          id="addressLine1"
          className={inputClass}
          {...register('addressLine1')}
        />
      </FormItem>

      <FormItem>
        <Label htmlFor="addressLine2">Apartment, area, sector, village</Label>
        <Input
          autoComplete="address-line2"
          id="addressLine2"
          className={inputClass}
          {...register('addressLine2')}
        />
      </FormItem>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem>
          <Label htmlFor="city">City</Label>
          <Input
            autoComplete="address-level2"
            id="city"
            className={inputClass}
            {...register('city')}
          />
        </FormItem>

        <FormItem>
          <Label htmlFor="state">State</Label>
          <Input
            autoComplete="address-level1"
            id="state"
            className={inputClass}
            {...register('state')}
          />
        </FormItem>
      </div>

      <FormItem>
        <Label htmlFor="postalCode">Pincode</Label>
        <Input
          autoComplete="postal-code"
          id="postalCode"
          inputMode="numeric"
          className={inputClass}
          {...register('postalCode')}
        />
      </FormItem>
    </div>
  )
}

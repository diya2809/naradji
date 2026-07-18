'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  isValidPhone,
  isValidPincode,
  type AddressFormValues,
} from '@/ecommerce/addressForm'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

type Props = {
  errors: FieldErrors<AddressFormValues>
  register: UseFormRegister<AddressFormValues>
}

export function AddressFormFields({ errors, register }: Props) {
  const inputClass =
    'border-primary bg-background/50 hover:border-primary hover:bg-background/50 focus-visible:border-primary focus-visible:ring-primary/20'

  return (
    <div className="grid gap-4">
      <FormItem>
        <Label htmlFor="name">Full name*</Label>
        <Input
          autoComplete="name"
          id="name"
          className={inputClass}
          {...register('name', { required: 'Name is required.' })}
        />
        {errors.name ? <FormError message={errors.name.message} /> : null}
      </FormItem>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem>
          <Label htmlFor="phone">Phone number*</Label>
          <Input
            autoComplete="tel"
            id="phone"
            inputMode="tel"
            type="tel"
            className={inputClass}
            {...register('phone', {
              required: 'Phone number is required.',
              validate: (value) => isValidPhone(value) || 'Enter a valid 10-digit mobile number.',
            })}
          />
          {errors.phone ? <FormError message={errors.phone.message} /> : null}
        </FormItem>

        <FormItem>
          <Label htmlFor="alternatePhone">Alternate phone (optional)</Label>
          <Input
            autoComplete="tel"
            id="alternatePhone"
            inputMode="tel"
            type="tel"
            className={inputClass}
            {...register('alternatePhone', {
              validate: (value) =>
                !value?.trim() || isValidPhone(value) || 'Enter a valid 10-digit mobile number.',
            })}
          />
          {errors.alternatePhone ? <FormError message={errors.alternatePhone.message} /> : null}
        </FormItem>
      </div>

      <FormItem>
        <Label htmlFor="addressLine1">Flat, house no.*</Label>
        <Input
          autoComplete="address-line1"
          id="addressLine1"
          className={inputClass}
          {...register('addressLine1', { required: 'Tell us your flat or house number.' })}
        />
        {errors.addressLine1 ? <FormError message={errors.addressLine1.message} /> : null}
      </FormItem>

      <FormItem>
        <Label htmlFor="addressLine2">Apartment, area, sector, village*</Label>
        <Input
          autoComplete="address-line2"
          id="addressLine2"
          className={inputClass}
          {...register('addressLine2', { required: 'Add your area or locality.' })}
        />
        {errors.addressLine2 ? <FormError message={errors.addressLine2.message} /> : null}
      </FormItem>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem>
          <Label htmlFor="city">City*</Label>
          <Input
            autoComplete="address-level2"
            id="city"
            className={inputClass}
            {...register('city', { required: 'City is required.' })}
          />
          {errors.city ? <FormError message={errors.city.message} /> : null}
        </FormItem>

        <FormItem>
          <Label htmlFor="state">State*</Label>
          <Input
            autoComplete="address-level1"
            id="state"
            className={inputClass}
            {...register('state', { required: 'State is required.' })}
          />
          {errors.state ? <FormError message={errors.state.message} /> : null}
        </FormItem>
      </div>

      <FormItem>
        <Label htmlFor="postalCode">Pincode*</Label>
        <Input
          autoComplete="postal-code"
          id="postalCode"
          inputMode="numeric"
          maxLength={6}
          className={inputClass}
          {...register('postalCode', {
            required: 'Pincode is required.',
            validate: (value) => isValidPincode(value) || 'Enter a valid 6-digit pincode.',
          })}
        />
        {errors.postalCode ? <FormError message={errors.postalCode.message} /> : null}
      </FormItem>
    </div>
  )
}

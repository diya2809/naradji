'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { sendOrderAccessEmail } from './sendOrderAccessEmail'

type FormData = {
  email: string
  orderID: string
}

type Props = {
  initialEmail?: string
}

export const FindOrderForm: React.FC<Props> = ({ initialEmail }) => {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>({
    defaultValues: {
      email: initialEmail || user?.email,
    },
  })

  const onSubmit = useCallback(async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await sendOrderAccessEmail({
        email: data.email,
        orderID: data.orderID,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setSubmitError(result.error || 'Could not send email.')
      }
    } catch {
      setSubmitError('Could not send email.')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  if (success) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">Link sent if the order exists.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-semibold">Find order</h1>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            {...register('email', { required: 'Email is required.' })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="orderID">Order ID</Label>
          <Input
            id="orderID"
            {...register('orderID', {
              required: 'Order ID is required.',
            })}
            type="text"
          />
          {errors.orderID && <FormError message={errors.orderID.message} />}
        </FormItem>
        {submitError && <FormError message={submitError} />}
        <Button disabled={isSubmitting} type="submit" variant="default">
          {isSubmitting ? 'Sending' : 'Send link'}
        </Button>
      </form>
    </div>
  )
}

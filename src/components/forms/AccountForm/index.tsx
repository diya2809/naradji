'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { IconPencil } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'

type FormData = {
  email: string
  name: User['name']
}

export const AccountForm: React.FC = () => {
  const { setUser, user } = useAuth()
  const isMobile = useIsMobile()

  const {
    formState: { errors, isLoading, isSubmitting, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<FormData>()

  const router = useRouter()

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
          body: JSON.stringify(data),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        })

        if (response.ok) {
          const json = await response.json()
          setUser(json.doc)
          toast.success('Successfully updated account.')
          reset({
            name: json.doc.name,
            email: json.doc.email,
          })
        } else {
          toast.error('There was a problem updating your account.')
        }
      }
    },
    [user, setUser, reset],
  )

  useEffect(() => {
    if (user === null) {
      router.push(
        `/login?error=${encodeURIComponent(
          'You must be logged in to view this page.',
        )}&redirect=${encodeURIComponent('/account')}`,
      )
    }

    if (user) {
      reset({
        name: user.name,
        email: user.email,
      })
    }
  }, [user, router, reset])

  if (user === undefined) {
    return <Skeleton aria-busy="true" className="max-w-xl h-40 rounded-lg" />
  }

  return (
    <form className="max-w-xl" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-3 mb-4">
        <FormItem>
          <Input
            id="email"
            {...register('email', { required: 'Please provide an email.' })}
            type="email"
            readOnly
            className="border-none bg-transparent shadow-none p-0 focus-visible:ring-0 select-text text-muted-foreground h-auto cursor-default"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <div className="flex items-center justify-between gap-2 max-w-sm pb-1 transition-all">
            <Input
              id="name"
              {...register('name', { required: 'Please provide a name.' })}
              type="text"
              placeholder="Name"
              className="border-none bg-transparent shadow-none p-0 focus-visible:ring-0 select-text h-auto font-medium text-foreground text-lg w-full"
            />
            <IconPencil className="h-4.5 w-4.5 text-muted-foreground/60 shrink-0" />
          </div>
          {errors.name && <FormError message={errors.name.message} />}
        </FormItem>
      </div>

      {isDirty && (
        <Button
          disabled={isLoading || isSubmitting}
          type="submit"
          className="bg-transparent hover:bg-transparent text-primary hover:text-primary/80 font-semibold p-0 h-auto border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 cursor-pointer"
        >
          {isLoading || isSubmitting ? 'Processing...' : 'save changes'}
        </Button>
      )}
    </form>
  )
}

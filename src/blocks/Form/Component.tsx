'use client'
import type { FormFieldBlock } from '@payloadcms/plugin-form-builder/types'

import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { BlockWrapper } from '@/components/BlockWrapper'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buildInitialFormState } from './buildInitialFormState'
import { fields } from './fields'
import { getClientSideURL } from '@/utilities/getURL'
import type { FormBlock as FormBlockProps } from '@/payload-types'
import { isPopulatedForm } from '@/utilities/isPopulatedForm'
import { isPayloadRichText } from '@/types/lexical'
import { DefaultDocumentIDType } from 'payload'

export type Value = unknown

export interface Property {
  [key: string]: Value
}

export interface Data {
  [key: string]: Property | Property[]
}

export const FormBlock: React.FC<
  FormBlockProps & {
    id?: DefaultDocumentIDType
  }
> = (props) => {
  const { enableIntro, form: formRelation, introContent, mobileLayout, textAlign } = props

  if (!isPopulatedForm(formRelation)) {
    return (
      <BlockWrapper mobileLayout={mobileLayout} textAlign={textAlign}>
        <Alert variant="destructive">
          <AlertDescription>
            Form fields are not loaded. Please re-seed or publish the contact page again.
          </AlertDescription>
        </Alert>
      </BlockWrapper>
    )
  }

  const formFromProps = formRelation
  const {
    id: formID,
    confirmationMessage,
    confirmationType,
    redirect,
    submitButtonLabel,
  } = formFromProps

  const formMethods = useForm({
    defaultValues: buildInitialFormState(
      (formFromProps.fields ?? []) as FormFieldBlock[],
    ),
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()
  const hasRenderableFields = !!formFromProps && Array.isArray(formFromProps.fields)

  const onSubmit = useCallback(
    (data: Data) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || 'Internal Server Error',
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <BlockWrapper mobileLayout={mobileLayout} narrow textAlign={textAlign}>
      {enableIntro && isPayloadRichText(introContent) && !hasSubmitted && (
        <RichText className="mb-6" data={introContent} enableGutter={false} />
      )}
      <div className="space-y-6">
        <FormProvider {...formMethods}>
          {!isLoading &&
            hasSubmitted &&
            confirmationType === 'message' &&
            isPayloadRichText(confirmationMessage) && (
              <RichText data={confirmationMessage} />
            )}
          {isLoading && !hasSubmitted && (
            <Alert>
              <AlertDescription>Loading, please wait...</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{`${error.status || '500'}: ${error.message || ''}`}</AlertDescription>
            </Alert>
          )}
          {!hasRenderableFields && !hasSubmitted && (
            <Alert variant="destructive">
              <AlertDescription>Form fields are not loaded. Please re-seed or publish the contact page again.</AlertDescription>
            </Alert>
          )}
          {!hasSubmitted && hasRenderableFields && (
            <form className="space-y-6" id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                {formFromProps.fields?.map((field, index) => {
                  const Field: React.FC<any> | undefined =
                    fields?.[field.blockType as keyof typeof fields]

                  if (Field) {
                    return (
                      <div key={index}>
                        <Field
                          form={formFromProps}
                          {...field}
                          {...formMethods}
                          control={control}
                          errors={errors}
                          register={register}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              <Button form={formID} type="submit" variant="default">
                {submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </BlockWrapper>
  )
}

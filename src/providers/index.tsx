import { CartProvider } from '@/components/Cart'
import { AuthProvider } from '@/providers/Auth'
import { EcommerceSessionBridge } from '@/providers/EcommerceSessionBridge'
import { cartLineProductPopulate } from '@/utilities/fetchListingProducts'
import { inrCurrencyConfig } from '@/lib/inrCurrency'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { codAdapterClient } from '@/plugins/cod/client'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <HeaderThemeProvider>
            <SonnerProvider />
            <EcommerceProvider
              currenciesConfig={inrCurrencyConfig}
              enableVariants={true}
              api={{
                cartsFetchQuery: {
                  depth: 3,
                  populate: cartLineProductPopulate,
                },
              }}
              paymentMethods={[codAdapterClient()]}
            >
              <EcommerceSessionBridge>{children}</EcommerceSessionBridge>
            </EcommerceProvider>
          </HeaderThemeProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

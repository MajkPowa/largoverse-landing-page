/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Přístupové kódy do uzavřené bety, oddělené čárkou (nešifrovaný build). */
  readonly VITE_ACCESS_CODES?: string
  /** 'off' vypne vnitřní bránu — používá se u šifrovaného buildu. */
  readonly VITE_GATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

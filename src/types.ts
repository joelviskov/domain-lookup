export interface Domain {
  name: string
  type: DomainType
}

export interface DomainStatus {
  available: boolean
  domain: string
}

export interface DomainError {
  code: string
  domain: string
}

export type DomainType = 'GENERIC' | 'COUNTRY_CODE'


export interface AppContext {
  lastSearch: string
  statuses: DomainStatus[]
}
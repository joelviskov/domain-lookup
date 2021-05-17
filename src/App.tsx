import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import 'semantic-ui-css/semantic.min.css'
import { Container, Divider, Form, Header, Label, Message } from 'semantic-ui-react';
import API from './client';
import { AppContext, Domain, DomainStatus } from './types';

const Context = createContext<AppContext>({ lastSearch: '', statuses: [] })
const SearchRegex = new RegExp(/^[a-zA-Z0-9]*$/)

const App = () => {
  const [domains, setDomains] = useState<Domain[]>([])
  const [search, setSearch] = useState<string>('')
  const [lastSearch, setLastSearch] = useState<string>('')
  const [statuses, setStatuses] = useState<DomainStatus[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    API.getDomains()
      .then((response) => setDomains(response.data.sort((x, y) => x.name > y.name ? 1 : -1)))
      .catch((error) => console.log(error))
  }, [])

  const onSubmit = async () => {
    setLastSearch(search)
    setStatuses([])
    setError('')

    for (const domain of domains) {
      if (error) return

      try {
        const response = await API.getAvailability(search, domain)
        setStatuses(prev => [...prev, response.data])
      } catch (e) {
        setError(JSON.stringify(e))
        return
      }
    }
  }

  return (
    <Context.Provider value={{ lastSearch, statuses } as AppContext}>
      <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
        {error && (
          <Message color='red'>
            {error}
          </Message>
        )}

        <Form onSubmit={onSubmit}>
          <Form.Field>
            <label>Search</label>
            <input value={search} onChange={(event) => {
              const term = event.target.value
              if (SearchRegex.test(term)) {
                setSearch(term)
              }
            }} />
          </Form.Field>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <DomainGroup
            header={'General'}
            domains={domains.filter(x => x.type === 'GENERIC')}
          />

          <DomainGroup
            header={'Country Domains'}
            domains={domains.filter(x => x.type === 'COUNTRY_CODE')}
          />
        </div>
      </Container>
    </Context.Provider>
  );
}

const DomainGroup = ({ header, domains }: { header: string, domains: Domain[] }) => {
  return (
    <div>
      <Divider horizontal>
        <Header as='h4'>
          {header}
        </Header>
      </Divider>

      {domains?.map((d) => <DomainLabel key={d.name} name={d.name} />)}
    </div>
  )
}

const DomainLabel = ({ name }: { name: string }) => {
  const { statuses, lastSearch } = useContext<AppContext>(Context)

  const text = useMemo(() => `${lastSearch}.${name}`, [lastSearch, name])

  const color = useMemo(() => {
    const status = statuses.find(x => x.domain === text)
    if (!status) return 'grey'
    return status.available ? 'green' : 'red'
  }, [statuses, text])

  return (
    <Label style={{ margin: '2px' }} color={color}>
      {text}
    </Label>
  )
}

export default App;

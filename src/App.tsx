import 'semantic-ui-css/semantic.min.css'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Container, Dimmer, Divider, Form, Header, Input, Label, Loader, Message } from 'semantic-ui-react';
import { AppContext, Domain, DomainStatus } from './types';
import API from './client';

const Context = createContext<AppContext>({ lookup: '', statuses: [] })
const SearchRegex = new RegExp(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$/)

const App = () => {
  const [domains, setDomains] = useState<Domain[]>([])
  const [input, setInput] = useState<string>('')
  const [lookup, setLookup] = useState<string>('')
  const [statuses, setStatuses] = useState<DomainStatus[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const cancel = useRef<(() => void) | undefined>()

  useEffect(() => {
    setLoading(true)
    API.getDomains()
      .then((response) => {
        response.data.sort((x, y) => x.name > y.name ? 1 : -1)
        setDomains(response.data)
      })
      .catch((e) => console.log(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!!cancel.current) {
      setLookup('')
      cancel.current()
      cancel.current = undefined
    }
  }, [input])

  const onSubmit = async (term: string) => {
    if (!term || !domains || loading || !SearchRegex.test(input)) return
    setLookup(term)
    setStatuses([])
    setError('')

    await new Promise<void>(async (resolve) => {
      cancel.current = () => resolve()
      for (const domain of domains) {
        if (error || !cancel.current) break
        fetchDomainStatus(term, domain)
        // Wait 1s to avoid rate limits on free API.
        await new Promise(timeout => setTimeout(timeout, 1000));
      }
    })
  }

  const fetchDomainStatus = async (name: string, tld: Domain) => {
    try {
      const response = await API.getAvailability(name, tld)
      setStatuses(prev => [...prev, response.data])
    } catch (e) {
      setError(JSON.stringify(e))
      return
    }
  }

  if (loading) {
    return (
      <Dimmer active inverted>
        <Loader inverted>Loading</Loader>
      </Dimmer>
    )
  }

  return (
    <Context.Provider value={{ lookup: lookup, statuses } as AppContext}>
      <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
        <div>
          <small style={{ float: 'left' }}>
            Made by <a href="http://www.viskov.ee" target="_blank" rel="noreferrer">Joel Viskov</a>
          </small>
          <small style={{ float: 'right' }}>
            <a href="https://github.com/joelviskov/domain-lookup" target="_blank" rel="noreferrer">Source code</a>
          </small>
        </div>
        <br />
        <hr />
        <p>This is just a demo application for testing out AWS Lambdas. API is limited to 60 requests per minute, so you might hit rate limit. Because of that, I set up 1 sec sleep between queries.</p>

        {error && (
          <Message color='red'>
            {error}
          </Message>
        )}

        <Form onSubmit={() => onSubmit(input)}>
          <Form.Field>
            <label>Domain Name Search</label>
            <Input
              loading={!!cancel.current}
              action={{ color: 'blue', content: 'Search', icon: 'search', disabled: !SearchRegex.test(input) }}
              value={input}
              placeholder={'google'}
              onChange={(event) => {
                const term = event.target.value
                setInput(term.toLowerCase())
              }}
            />
          </Form.Field>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <DomainGroup
            header={'Country Domains'}
            domains={domains.filter(x => x.type === 'COUNTRY_CODE')}
          />

          <DomainGroup
            header={'General Domains'}
            domains={domains.filter(x => x.type === 'GENERIC')}
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
  const { statuses, lookup } = useContext<AppContext>(Context)

  const text = useMemo(() => `${lookup}.${name}`, [lookup, name])

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

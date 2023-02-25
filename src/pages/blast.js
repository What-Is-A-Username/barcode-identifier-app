import { useCallback, useState } from 'react';
import { Alert, Button, Form, FormCheck, FormControl, FormGroup, FormLabel, FormSelect } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomHelmet from '../components/custom-helmet';
import { ErrorMessage, handleResponse } from '../components/error-message';
import Wrapper from '../components/wrapper';
import { urlRoot } from '../url';
import { IoMdSend } from 'react-icons/io'

function Blast() {

    let navigate = useNavigate()
    let [searchParams] = useSearchParams()
    let [responseError, setResponseError] = useState(null)
    let [sequenceInvalid, setSequenceInvalid] = useState(false)

    const [fields, setFields] = useState({
        job_name: '',
        databaseSelect: searchParams.get('database'),
        create_hit_tree: searchParams.get('createHitTree') ?? false,
        create_db_tree: searchParams.get('createDbTree') ?? false,
        query_file: undefined,
    })

    let defaultSelected = searchParams.get('database')
    if (!defaultSelected) defaultSelected = ''

    const setDefault = useCallback((defaultDb) => {
        if (!fields.databaseSelect) setFields({ ...fields, databaseSelect: defaultDb })
    }, [fields])

    const { isLoading, error, data: dbs, isError } = useQuery(['blast_database_options'], () =>
        fetch(`${urlRoot}/blastdbs/`)
            .then(handleResponse()),
        {
            onSuccess: (data) => {
                setDefault(data[0].id)
            },
            refetchInterval: false,
            retry: false,
        }
    )

    const handleChange = (event) => {
        if (event.target.type === 'checkbox') {
            setFields({ ...fields, [event.target.name]: event.target.checked })    
        } else {
            setFields({ ...fields, [event.target.name]: event.target.value })
        }
        setSequenceInvalid(false)
        setResponseError(null)
    }

    const handleSubmit = (event) => {
        event.preventDefault()

        if (typeof window === 'undefined' || typeof window === 'undefined') {
            return
        }

        // TODO: Show an error if there is both a file upload AND a raw text sequence present
        // if (fields.querySequence.length < 4)
        //     return

        if (true) {
            const form_info = document.getElementById('blastForm')
            let formData = new FormData(form_info)
            let d = ['create_db_tree', 'create_hit_tree']
            d.forEach(key => {
                if (formData.has(key)) {
                    formData.set(key, formData.get(key) === 'true')
                }
            })

            let url = `${urlRoot}/blastdbs/${fields.databaseSelect}/run/`

            let postHeaders = {
                'Accept': 'application/json',
            }

            // TODO: Handle bad requests

            fetch(url, { method: 'POST', headers: postHeaders, mode: 'cors', body: formData })
            .then(response => {
                if (response.status === 400) {
                    // a known error
                    response.json().then(error => {
                        setResponseError(error.message)
                        setSequenceInvalid(true)
                    })
                } else if (response.status === 201) {
                    // successful post
                    response.json().then(data => {
                        navigate(`/run/${data.id}/status`)
                    })
                } else if (!response.ok) {
                    // unexpected error
                    setResponseError(`Error ${response.status}: ${response.statusText}.`)
                    throw new Error()
                }
            })
            .catch(error => {
                console.log(`The website encountered an unexpected error.`)
            })


        }
    }

    const onFileChange = (event) => {
        setFields({ ...fields, 'query_file': event.target.files[0] })
    }

    if (isLoading) return (
        <Wrapper>
            <h2>Submit BLAST Run</h2>
            <p>Loading form data ...</p>
        </Wrapper>
    )

    if (isError) return (
        <Wrapper>
            <h2>Submit BLAST Run</h2>
            <ErrorMessage error={error} />
        </Wrapper>
    )

    return (
        <Wrapper>
            <CustomHelmet
            title='Submit run'
            description='Submit nucleotide sequences to run BLAST against the barcode database.'
            canonical='blast'
            />
            <h2>Submit BLAST Run</h2>
            {
                responseError &&
                <Alert variant='danger'>
                    <Alert.Heading>Error</Alert.Heading>
                    {responseError}
                </Alert> 
            }
            <Form id='blastForm' onSubmit={handleSubmit} className='col-12'>
                
                <h5>Query  Sequence</h5>
                <FormGroup className='my-3 mx-5'>
                    <FormLabel htmlFor='queryFile'>Upload sequence .fasta file</FormLabel>
                    <FormControl isInvalid={sequenceInvalid} id='queryFile' name='query_file' type='file' onChange={onFileChange}></FormControl>
                    <strong className='my-1'>OR</strong><br/>
                    <FormLabel htmlFor='querySequence'>Paste raw sequence text</FormLabel>
                    <FormControl isInvalid={sequenceInvalid} id='querySequence' name='query_sequence' as='textarea' rows={5} onChange={handleChange} placeholder='Provide sequences in FASTA format'></FormControl>
                    <Form.Control.Feedback type="invalid">
                        {"Error: " + responseError}
                    </Form.Control.Feedback>
                </FormGroup>
                <h5>Nucleotide BLAST Parameters</h5>
                <FormGroup className='my-3 mx-5'>
                    <FormLabel htmlFor='databaseSelect'>Blast Database</FormLabel>
                    <FormSelect aria-label='Select database to query on' name='id' id='databaseSelect' defaultValue={defaultSelected} onChange={handleChange}>
                        {dbs.map(db => <option value={db.id} key={db.id}>{db.custom_name} ({db.id})</option>)}
                    </FormSelect>
                    <div className='d-flex justify-content-end'>
                        <a target='_blank' rel='noreferrer' style={{fontSize: '0.9em', textAlign: 'right'}} href={`/database/${fields.databaseSelect}`}>Browse this database</a>
                    </div>
                </FormGroup>
                <h5>Multiple Alignment Parameters</h5>
                <FormGroup className='my-3 mx-5'>
                    <FormCheck id='createHitTree' name='create_hit_tree' type='checkbox' value={fields.create_hit_tree} onChange={handleChange} label='Construct tree with only queries and hits (Create hit tree)'></FormCheck>
                </FormGroup>
                <FormGroup className='my-3 mx-5'>
                    <FormCheck id='createDbTree' name='create_db_tree' type='checkbox' onChange={handleChange} value={fields.create_db_tree} label='Construct tree with queries and all database sequences (Create database tree)'></FormCheck>
                </FormGroup>
                {/* TODO: Allow tree construction to be turned on/off */}
                <h5>Job Name</h5>
                <FormGroup className='my-3 mx-5'>
                    <FormLabel htmlFor='jobName'>Provide this run with a custom name (optional)</FormLabel>
                    <FormControl id='jobName' name='job_name' as='input' placeholder='' onChange={handleChange}></FormControl>
                </FormGroup>
                <Button disabled={responseError} type='submit' className='my-3'><IoMdSend style={{marginRight: '5px', marginBottom: '2px'}}/>Submit Query</Button>
            </Form>
        </Wrapper>
    );
}

export default Blast;

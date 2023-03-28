import React from 'react'
import { Breadcrumb, BreadcrumbItem, Button, Col, Container, Row } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Link, useParams } from 'react-router-dom'
import CustomHelmet from '../components/custom-helmet';
import DbSummary from '../components/db-summary';
import DbTable from '../components/db-table';
import { ErrorMessage, handleResponse } from '../components/error-message';
import Wrapper from '../components/wrapper';
import { urlRoot } from '../url';

const BlastDb = () => {

    const { databaseId } = useParams();

    const { isLoading, error, data, isError } = useQuery([`blastdb_${databaseId}`], () =>
        fetch(`${urlRoot}/blastdbs/${databaseId}`, {
            mode: 'cors'
        })
            .then(handleResponse()),
        {
            refetchInterval: false,
            retry: false,
        }
    )

    const downloadFile = (format) => {
        const types = { 'text/csv': 'csv', 'text/x-fasta': 'fasta' }

        if (typeof window === 'undefined') {
            console.error("Cannot download CSV file with window undefined.")
            return
        } else if (!Object.keys(types).includes(format)) {
            console.error(`The format ${format} is not available for export.`)
            return
        }

        const fetchHeaders = new Headers()
        fetchHeaders.append('Accept', format)

        fetch(`${urlRoot}/blastdbs/${databaseId}`, {
            method: `GET`,
            headers: fetchHeaders
        })
            .then((response) => response.blob())
            .then((blob) => {
                const url = window.URL.createObjectURL(
                    new Blob([blob])
                )
                const link = document.createElement('a',)
                link.href = url
                link.setAttribute('download', `results.${types[format]}`)
                document.body.appendChild(link)
                link.click()
                link.parentNode.removeChild(link)
            })
    }

    const helmet = <CustomHelmet
        title='Custom database'
        description='Browse entries in this custom database.'
        canonical='database'
    />

    if (isLoading) return (
        <Wrapper>
            {helmet}
            <div>
                <p>Retrieving data ...</p>
            </div>
        </Wrapper>
    )

    if (isError) return (
        <Wrapper>
            {helmet}
            <h1>Blast database not found</h1>
            <ErrorMessage error={error} text="Encountered an error fetching databases. Please try again." />
        </Wrapper>
    )

    return (
        <Wrapper>
            {helmet}
            <Breadcrumb>
                <BreadcrumbItem href='/'>Home</BreadcrumbItem>
                <BreadcrumbItem href='/database'>Databases</BreadcrumbItem>
                <BreadcrumbItem active>{data.custom_name}</BreadcrumbItem>
            </Breadcrumb>
            <div>
                <h1>"{data.custom_name}"</h1>

                <Container className='g-0 mb-2'>
                    <Row className='d-flex align-items-center'>
                        <Col className='col-auto'>
                            <Button variant='primary' className='align-middle'>
                                <Link to={`/blast/?database=${data.id}`} className='text-white text-decoration-none'>Run a Query</Link>
                            </Button>
                        </Col>
                    </Row>
                </Container>

                <h3>Description</h3>
                <p>{data.description}</p>

                <h3>Database entries</h3>
                <p className='text-muted'>This database contains {data.sequences.length} entries.</p>
                <DbSummary sequences={data.sequences}/>
                <DbTable data={data.sequences}></DbTable>
                <h3>Export</h3>
                <Container className='g-0'>
                    <Row className='d-flex align-items-center pb-3'>
                        <Col className='col-auto'>
                            <Button variant='primary' className='align-middle text-white text-decoration-none mx-0' onClick={() => downloadFile('text/csv')}>
                                .csv
                            </Button>
                        </Col>
                        <Col className='col-auto'>
                            <Button variant='primary' className='align-middle text-white text-decoration-none' onClick={() => downloadFile('text/x-fasta')}>
                                .fasta
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Wrapper>
    )
}

export default BlastDb
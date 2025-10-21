import { useEffect } from 'react'
import WebDataRocks from '@webdatarocks/webdatarocks'
import '@webdatarocks/webdatarocks/webdatarocks.min.css'

const TestPage = () => {
  useEffect(() => {
    new WebDataRocks({
      container: '#pivotContainer',
      toolbar: true,
      report: {
        dataSource: {
          data: [
            { Country: 'USA', Sales: 120, Profit: 35 },
            { Country: 'Korea', Sales: 90, Profit: 25 },
            { Country: 'Japan', Sales: 150, Profit: 45 },
          ],
        },
      },
    })
  }, [])

  return <div id='pivotContainer' style={{ height: '600px', width: '100%' }} />
}

export default TestPage

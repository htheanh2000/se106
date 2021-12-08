
import './App.scss'
import { useRef, useState } from 'react'
import ts from "typescript";
import FileSaver, { saveAs } from 'file-saver';

type parseObject = {
  name: string,
  pre: string,
  post: string,
  parameter: parameter[],
  result: result
}

type parameter = {
  name: string,
  type: string,
  value: any
}

type result = {
  name: string,
  type: string,
}


const INIT_OBJECT = {
  name: '',
  pre: '',
  post: '',
  parameter: [],
  result: {
    name: '',
    type: ''
  }
}
const INIT_INPUT = ``
function App() {
  const [input, setInput] = useState<string>(INIT_INPUT)
  const [output, setOutput] = useState<string>('')
  const [object, setObject] = useState<parseObject>(INIT_OBJECT)

  const fileRef = useRef<any>()
  const onClickChangeBtn = () => {
    // setOutput(input)
    const newInput = input.toLowerCase()
    const name = getName(newInput)
    const parameter = getParams(newInput)
    const result = getResult(newInput)
    const pre = getPre(newInput)
    const post = getPost(newInput)
    setObject({ name, pre, post, parameter, result })
    updateOutput(name, pre, post, parameter, result)
  }

  const getName = (input: string) => {
    return input.split('(')[0].trim()
  }

  const getParams = (input: string) => {
    const open = input.indexOf('(')
    const close = input.indexOf(')')
    const params = input.slice(open + 1, close).split(',').map(item => {
      const splitArr = item.split(':')
      return {
        name: splitArr[0].trim(),
        type: getType(splitArr[1] ? splitArr[1].trim() : ''),
        value: ''
      }
    })
    return params
  }

  const getResult = (input: string) => {
    const close = input.indexOf(')')
    const preId = input.indexOf('pre')
    const resultArr = input.slice(close + 1, preId).split(':')
    return {
      name: resultArr[0].trim(),
      type: getType(resultArr[1].trim()),
    }
  }

  const getPost = (input: string) => {
    const postIndex = input.indexOf('post') + 4
    const post = input.slice(postIndex, input.length - 1).trim()
    const result = post.split('=')[0]
    if (post.includes('th')) { // Detect type is 2
      const conditions = post.split('}.')
      let string = ''
      for (let index = conditions.length - 1; index >= 0; index--) {
        let element = conditions[index].replaceAll(' ', '')

        if (!element.includes('th')) // phep tinh toan 
        {
          string += `
            if (${element.replaceAll('(', '[').replaceAll(')', ']')}) {
            //  ${result} = true;
          }
          else {
            ${result} = false;
          }
          `

        }
        else {
          const thIndex = element.indexOf('th')
          const vmIndex = element.indexOf('vm')
          const ttIndex = element.indexOf('tt')
          const startIndex = vmIndex > ttIndex ? vmIndex : ttIndex
          const indexName = element.substring(startIndex + 2, thIndex)
          const startValue = element.substring(element.indexOf('{') + 1, element.indexOf('..'))
          const endValue = element.substring(element.indexOf('..') + 2, element.length)
          string = `
          ${result} = true
           for (let ${indexName} = ${startValue}; i <= ${endValue}  ; i++) { 
            ${string}
           }`

        }

        // console.log(string);
      }
      return string
    }

    return post
  }

  const getPre = (input: string) => {
    const preIndex = input.indexOf('pre') + 3
    const postIndex = input.indexOf('post')
    return input.slice(preIndex, postIndex).trim()
  }

  const getType = (key: string) => {
    switch (key) {
      case 'r':
        return 'number';
      case 'z':
        return 'number';
      case 'b':
        return 'boolean';
      default:
        return 'any';
    }
  }

  const updateOutput = (name: any, pre: any, post: any, parameter: any, result: any) => {
    const outputStr = `({
    Run: ({${parameter.map((param: any) => param.name)}} : {${parameter.map((param: any) => param.name + ':' + param.type)}}) => {
        let ${result.name}: ${result.type}
        if(${pre || 1}) {
           ${post};
          alert(${result.name})
           return ${result.name};
        }
        else {
          alert('Invalid parameter!')
        }
    }
  })
    `
    setOutput(outputStr)
  }


  const run = () => {
    let code: string = output
    let result = ts.transpile(code);
    let runnalbe: any = eval(result);
    const input: any = {}
    object.parameter.map(param => {
      input[param.name] = param.value
    })
    console.log(input);

    runnalbe.Run(input)
  }

  const onchange = (value: string, property: string) => {
    const newObject = {
      ...object,
      parameter: object.parameter.map(param => {
        return {
          ...param,
          value: param.name === property ? value : param.value
        }
      })
    }
    setObject(newObject)
  }

  const f = ({ a, n }: { a: any, n: any }) => {
    let kq: boolean
    if (1) {

      kq = true
      for (let i = 1; i <= n - 1; i++) {
        kq = true
        for (let j = i + 1; i <= n; i++) {
          if (a[i] <= a[j]) {
            //  kq  = true;
          }
          else {
            kq = false;
          }
        }
      };
      alert(kq)
      return kq;
    }
    else {
      alert('Invalid parameter!')
    }
  }

  const onChangeFile = (event: any) => {
    event.stopPropagation();
    event.preventDefault();
    var file = event.target.files[0];
    let fileData = new FileReader();
    fileData.onloadend = handleFile;
    fileData.readAsText(file);

    setInput(file)
  }

  const handleFile = (e: any) => {
    const content = e.target.result;
    console.log('file content', content)
    setInput(content)
  }

  const chooseFile = () => {
    fileRef.current.click()
  }

  const downloadInput = () => {
    var blob = new Blob([input], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "input.txt");
  }

  const downloadOutput = () => {
    var blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "output.txt");
  }

  return (
    <div className='App'>
      <div className='input'>
        <textarea className='textArea' value={input} cols={50} placeholder='input' onChange={(e) => setInput(e.target.value)}></textarea>
        <div className='control'>
          <button className='control__btn' onClick={onClickChangeBtn}>Change</button>
          {
            object.parameter.map((param: any) =>
              <input key={param.name} className='control__input' value={param.value} placeholder={'Type value ' + param.name} onChange={e => onchange(e.currentTarget.value, param.name)}></input>
            )
          }
          <button className='control__btn' onClick={run}>Run</button>
        </div>
        <div className='output'>
          <p>
            <span>const </span>
            <span className='name'>{object.name}</span>
            <span className=''>= ({`{${object.parameter.map((param: any) => param.name)}} : {${object.parameter.map((param: any) => param.name + ':' + param.type)}}`}) ={'>'} {'{'}</span>
          </p>
          <p className='tab1'>{`let ${object.result.name}: ${object.result.type};`}</p>
          <p className='tab2'>{`if(${object.pre || 1}) {`}</p>
          <p className='tab3'>{` ${object.post};`}</p>
          <p className='tab3'><span className='alert'>alert</span>{`(${object.result.name});`}</p>
          <p className='tab3'><span className='return'>return</span>{` ${object.result.name};`}</p>
          <p className='tab2'>{`}`}</p>
          <p className='tab2'>{`else {`}</p>
          <p className='tab4'><span className='alert'>alert</span>('Invalid parameter!');</p>
          <p className='tab3'>{'}'}</p>
          <p className=''>{'}'}</p>
        </div>

      </div>
      <div>
        <input type='file' accept=".txt" ref={fileRef} onChange={onChangeFile} className='noneDisplay' />
        <button className='control__btn' onClick={chooseFile}>Choose file</button>
        <button className='control__btn' onClick={downloadInput}>Download input file</button>
        <button className='control__btn' onClick={downloadOutput}>Download output file</button>
      </div>
    </div>
  );
}

export default App;



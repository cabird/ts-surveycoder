import React, {useCallback, useMemo} from 'react';
import {useDropzone} from 'react-dropzone';

const baseStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    // add a top margin to avoid overlap with the header
    marginTop: '20px',
    borderWidth: 3,
    borderRadius: 4,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out'
  } as const;
  
  const focusedStyle = {
    borderColor: '#2196f3'
  };
  
  const acceptStyle = {
    borderColor: '#00e676'
  };
  
  const rejectStyle = {
    borderColor: '#ff1744'
  };


function MyDropzone(props: any) {
    const onDrop = useCallback((acceptedFiles: any) => {
        acceptedFiles.forEach((file: any) => {
            props.onFileDropped(file);
            /*const reader: FileReader = new FileReader();

            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
            reader.onload = () => props.onBlobReady(reader.result);
            reader.readAsArrayBuffer(file);*/
        }
        );

    }, []);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isFocused,
        isDragAccept,
        isDragReject
    } = useDropzone({
        onDrop,
        accept: {
            //excel mimetypes
            'application/vnd.ms-excel': ['.xlsx', '.xls'],
        }});

    const style = useMemo(() => ({
        ...baseStyle,
        ...(isFocused ? focusedStyle : {}),
        ...(isDragAccept ? acceptStyle : {}),
        ...(isDragReject ? rejectStyle : {})
    }), [
        isFocused,
        isDragAccept,
        isDragReject
    ]);
    return (
    <section className="container">
    <div {...getRootProps({style, className: "dropzone"})}>
        <input {...getInputProps()} />
        {
            isDragActive ?
                <p>Drop the files here ...</p> :
                <p>Drop Survey Excel File here</p>
        }
        </div>
        </section>);
}

export default MyDropzone;
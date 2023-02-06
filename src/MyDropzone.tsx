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
            console.log("User dropped file " + file.name);
            props.onFileDropped(file);
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
            //csv mimetypes
            'text/csv': ['.csv']
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
                <p>Drop Survey File (Excel or CSV) here</p>
        }
        </div>
        </section>);
}

export default MyDropzone;
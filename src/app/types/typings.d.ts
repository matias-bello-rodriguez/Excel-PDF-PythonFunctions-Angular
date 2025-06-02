declare module 'pdfmake/build/vfs_fonts' {
  const content: {
    pdfMake: {
      vfs: {
        [key: string]: string;
      };
    };
  };
  export = content;
}
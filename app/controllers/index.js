exports.index = (req, res) => {
    console.log('=========');
    // return res.render('index2', {
    //     title: 'Hello IM'
    // });
    return res.sendFile('index.html');
}
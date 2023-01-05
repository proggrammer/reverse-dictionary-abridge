function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}
function sayHello(x) {
    console.log(x)
}
const debouncedSayHello = debounce(sayHello, 100)
for(var i=100; i>=0; i--)    {
    debouncedSayHello(i);
}
setTimeout(function (){
    debouncedSayHello(555)
}, 50);
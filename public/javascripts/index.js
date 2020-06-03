

var abc = document.querySelectorAll("#calc");
var abcArr = Array.from(abc);
console.log("Test")
function summing() {
    var sum = abcArr.map(p=> +p.innerText).reduce(function(a, b){
        return a + b;
    }, 0);
    console.log(sum);
    document.getElementById("summ").innerText = sum;
}

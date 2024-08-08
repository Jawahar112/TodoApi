// function sum(a){
//     const computeValue = (b) => {
//         if(b!==undefined){
//             return a + b
//         }
//         return sum(a)
//     }
//     return computeValue
// }
function sum(a){
        return function computeValue  (b)  {
        if(b==undefined){
            return a
        }
        return sum(a+b)
    }
  
}
const result0=sum(3)(3)(3)()
console.log(result0);







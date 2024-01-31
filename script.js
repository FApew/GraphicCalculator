var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

const Box = document.getElementById("canvasBox")
const canvas = document.getElementById("canvas")
const input = document.getElementById("input")
const Isamp = document.getElementById("Isamp")
const Osamp = document.getElementById("Osamp")
const Done = document.getElementById("Done")
const ctx = canvas.getContext("2d")
input.value = ""
Isamp.value = 1200
let samples
var vtx = []
var toSkip = []
var vtxtemp = []

const resize = new ResizeObserver(() => {
    Update()
})
resize.observe(Box)

Isamp.addEventListener("change", Update)

async function Update() {
    let startTime = new Date()
    Done.style.backgroundColor = "#3a3a3a";
    Done.innerHTML = ""

    await new Promise(resolve => setTimeout(resolve, 0))
    samples = parseInt(Isamp.value)
    Osamp.innerHTML = samples
    canvas.width = Box.clientWidth
    canvas.height = Box.clientHeight
    ctx.fillStyle = "#404040"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawAxis()
    drawGrid()
    drawPoints()

    await new Promise(resolve => setTimeout(resolve, 0))
    Done.style.backgroundColor = "#fff"

    let timeDiff = new Date() - startTime
    Done.innerHTML = `${timeDiff}ms`
}


function drawAxis() {
    ctx.fillStyle = "#303030"
    ctx.fillRect(0, canvas.height/2-2, canvas.width, 4)
    ctx.fillRect(canvas.width/2-2, 0, 4, canvas.height)
}

function drawGrid() {
    let qWidth = canvas.width/30
    let offset = canvas.height/2%qWidth
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = "#353535"
        ctx.fillRect(qWidth*i-1, 0, 2, canvas.height)
    }
    for (let i = 0; i < Math.ceil(canvas.height/qWidth); i++) {
        ctx.fillStyle = "#353535"
        ctx.fillRect(0, qWidth*i-1+offset, canvas.width, 2)
    }
}

input.addEventListener("change", Update)

function drawPoints() {
    if (input.value.length != 0) {
        let In = input.value.split("=")
        let Exp = [In[0].toString(), In[1].toString()]
        vtx = []
        toSkip = []
        ctx.fillStyle = "#fff"
        let temp
        for (let i = 0; i < samples+1; i++) {
            var x = (i - Math.floor(samples/2))/Math.floor(samples/30)
            let ExpX = [Exp[0], Exp[1]]
            for (let i = 0; i < 2; i++) {
                ExpX[i] = normalize(ExpX[i].replaceAll("x", `(${x})`))
            }
            try {
                let eq = new Equation(algebra.parse(ExpX[0]), algebra.parse(ExpX[1]))
                let solY = eq.solveFor("y")
                if (!Array.isArray(solY)) {
                    solY = [solY];
                }
                solY.forEach((varY) => {
                    let y = eval(varY.toString())
                    console.log(`Sample ${i}: `, "X: " + x, "Y: " + y)
                    vtx.push([x*canvas.width/30+canvas.width/2, -y*canvas.width/30+canvas.height/2])
                    if(i!=0)
                    if (Math.abs(y-temp) > canvas.width/50) {
                        toSkip.push(i)
                    }
                    temp = y
                })
            } catch (e) {
                if (e instanceof EvalError) {
                    toSkip.push(i)
                }
            }
        }
        DrawLines()
    }
}

function normalize(exp) {
    return exp.replaceAll(/sqrt\(([^]+)\)/g, (match, content) => {
        return Math.sqrt(eval(content))
    }).replaceAll(/cos\(([^]+)\)/g, (match, content) => {
        return Math.cos(eval(content.replaceAll("^", "**")))
    }).replaceAll(/sin\(([^]+)\)/g, (match, content) => {
        return Math.sin(eval(content.replaceAll("^", "**")))
    }).replaceAll(/tan\(([^]+)\)/g, (match, content) => {
        return Math.tan(eval(content.replaceAll("^", "**")))
    })
}

function DrawLines() {
    for (let i = 0; i < vtx.length-1; i++) {
        if (toSkip.indexOf(i) == -1 && toSkip.indexOf(i+1) == -1) {
            var P1 = vtx[i]
            var P2 = vtx[i+1]
            let y = P1[1], x = P1[0]
            let Dx = Math.abs(P2[0] - P1[0]), Dy = Math.abs(P2[1] - P1[1]), S1 = Math.sign(P2[0] - P1[0]), S2 = Math.sign(P2[1] - P1[1]), Change = 0
            if (Dy > Dx) {
                let temp = Dx
                Dx = Dy
                Dy = temp
                Change = 1
            }
            let E = 2 * Dy - Dx, A = 2 * Dy, B = 2 * Dy - 2 * Dx
            ctx.fillRect(x-1, y-1, 2, 2)
            for (let i = 0; i < Dx; i++) {
            if (E < 0) {
                if (Change == 1) {
                y += S2
                } else {
                x += S1
                }
                E += A
            } else {
                y += S2
                x += S1
                E += B
            }
            ctx.fillRect(x-1, y-1, 2, 2)
            }
        }
    }
}
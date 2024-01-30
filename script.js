var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

const Box = document.getElementById("canvasBox")
const canvas = document.getElementById("canvas")
const input = document.getElementById("input")
const ctx = canvas.getContext("2d")
input.value = ""
var vtx = []
const samples = 300

const resize = new ResizeObserver(() => {
    Update()
})
resize.observe(Box)

function Update() {
    canvas.width = Box.clientWidth
    canvas.height = Box.clientHeight
    ctx.fillStyle = "#404040"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawAxis()
    drawGrid()
    drawPoints()
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
    let arrSol = solve(input.value)
    if (arrSol !== undefined) {
        for (let i = 0; i < arrSol.length; i++) {
            vtx = []
            let exp = algebra.parse(arrSol[i])
            console.log(exp.toString())
            ctx.fillStyle = "#fff"
            for (let i = 0; i < samples+1; i++) {
                var x = (i - Math.floor(samples/2))/Math.floor(samples/30)
                var y = eval(exp.eval({x: algebra.parse(`${x}`)}).toString())
                vtx.push([x*canvas.width/30+canvas.width/2, -y*canvas.width/30+canvas.height/2])
            }
            DrawLines()
        }
    } else {
        alert("Invalid input")
    }
}

function DrawLines() {
    for (let i = 0; i < vtx.length-1; i++) {
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
        ctx.fillRect(x, y, 1, 1)
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
        ctx.fillRect(x, y, 2, 2)
        }
    }
}

function solve(eqRaw) {
    let eqArr = eqRaw.split("=")
    let eq1 = algebra.parse(eqArr[0])
    let eq2 = algebra.parse(eqArr[1])
    console.log("Eq: ", eq1.toString(), eq2.toString())
    var eq = new Equation(eq1, eq2)
    let sol = eq.solveFor("y")
    return sol !== undefined ? sol.toString().trim().split(","): sol
}
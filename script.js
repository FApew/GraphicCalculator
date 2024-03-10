var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

const Box = document.getElementById("canvasBox")
const canvas = document.getElementById("canvas")
const input = document.getElementById("input")
const Isamp = document.getElementById("Isamp")
const Osamp = document.getElementById("Osamp")
const Done = document.getElementById("Done")
const mL = document.getElementById("mouseListener")
const ctx = canvas.getContext("2d")
input.value = "y=x^2"
Isamp.value = 1200

let samples, vtx = [], toSkip = [], vtxtemp = [], dots = true, stop = false, running = false, gridSize = 21
let zoomF = 1

const resize = new ResizeObserver(() => {
    Update()
})
resize.observe(Box)

Isamp.addEventListener("change", Update)

Done.addEventListener("click", () => {
    dots = !dots
    Update()
})

async function Update() {
    Done.style.backgroundColor = "#3a3a3a";
    Done.innerHTML = ""
    stop = true

    await new Promise(resolve => setTimeout(resolve, 0))
    samples = parseInt(Isamp.value)
    Osamp.innerHTML = samples
    canvas.width = Box.clientWidth
    canvas.height = Box.clientHeight
    ctx.fillStyle = "#404040"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawGrid(gridSize)
    while (running) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    stop = false

    await new Promise(resolve => setTimeout(resolve, 0))
    drawPoints()

    await new Promise(resolve => setTimeout(resolve, 0))
    Done.style.backgroundColor = "#fff"
}

function drawAxis() {
    ctx.fillStyle = "#252525"
    ctx.fillRect(0, canvas.height/2-2, canvas.width, 4)
    ctx.fillRect(canvas.width/2-2, 0, 4, canvas.height)
}

function drawNum(qN, offset, qW, temp) {
    let c = 0
    ctx.fillStyle = "#fff"
    ctx.font = "16px arial"
    ctx.textAlign = "center"
    for (let i = -1; i < qN+1; i++) {
        if(offset.x+qW*(i+1) == canvas.width/2) {
            c = i
            break
        }
    }
    for (let i = -1; i < qN+1; i++) {
        let zoom = zoomF >= 1 ? zoomF-zoomF%1 : zoomF
        let txt = Math.round((c-i)*-1/zoom*100)/100
        ctx.fillText(txt, offset.x+qW*(i+1), canvas.height/2)
    }
    for (let i = -1; i < Math.ceil(canvas.height/qW)+5; i++) {
        if (qW*i+offset.y == canvas.height/2) {
            c = i+1
            break
        }
    }
    for (let i = -1; i < Math.ceil(canvas.height/qW)+5; i++) {
        let zoom = zoomF >= 1 ? zoomF-zoomF%1 : zoomF
        let txt = Math.round((c-i)/zoom*100)/100
        ctx.fillText(txt, canvas.width/2, offset.y+qW*(i-1))
    }
}

function drawGrid() {
    let qN = zoomF >= 1 ? Math.ceil(gridSize/((zoomF%1/2)+1)) : gridSize+((gridSize/zoomF)%gridSize)
    qN = qN % 2 != 0 ? qN+=1 : qN
    let temp = 0
    let qW = canvas.width/qN
    let offset = {x: canvas.width/2%qW, y:canvas.height/2%qW}
    ctx.fillStyle= "#353535"
    for (let i = -1; i < qN+1; i++) {
        ctx.fillRect(canvas.width/qN*i+offset.x-1, 0, 2, canvas.height)
    }
    for (let i = -1; i < Math.ceil(canvas.height/qW)+5; i++) {
        ctx.fillRect(0, qW*i+offset.y-1, canvas.width, 2)
        temp++
    }
    drawAxis()
    drawNum(qN, offset, qW, temp)
}

input.addEventListener("change", Update)

async function drawPoints() {
    running = true
    if (input.value.length != 0) {
        let In = input.value.split("=")
        let Exp = [In[0].toString(), In[1].toString()]
        vtx = []
        toSkip = []
        ctx.fillStyle = "#fff"
        let temp
        for (let i = 0; i < samples+1; i++) {
            if (!stop) {
                Done.innerHTML = `${Math.round(i/samples*1000)/10}%`
                var x = (i - Math.floor(samples/2))/Math.floor(samples/gridSize*zoomF)
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
                        vtx.push([x*canvas.width/gridSize*zoomF+canvas.width/2, -y*canvas.width/gridSize*zoomF+canvas.height/2])
                        ctx.fillRect(x*canvas.width/gridSize*zoomF+canvas.width/2-1, -y*canvas.width/gridSize*zoomF+canvas.height/2-1, 2, 2)
                        if(i!=0)
                        if (Math.abs(y-temp) > canvas.width/50 && solY.length == 1) {
                            toSkip.push(i)
                        }
                        temp = y
                    })
                } catch (e) {
                    if (e instanceof EvalError) {
                        toSkip.push(i)
                    }
                }
                if (i%Math.round(((samples/24000)*30)) == 0) {
                    await new Promise(resolve => setTimeout(resolve, 0))
                }
            } else {
                running = false
                return
            }
        }
        
        DrawLines()
        running = false
    } else {
        running = false
        return
    }
}

function normalize(exp) {
    let res = exp
    let idxs
    idxs = indeces(res, "cos")
    for (let i = 0; i < idxs.length; i++) {
        let arg = normalize(res.slice(idxs[i]+3, closeB(res, idxs[i], 4)+1))
        res = res.replace(res.slice(idxs[i], closeB(res, idxs[i], 4)+1), `(${Math.cos(eval(arg.replaceAll("^", "**")))})`)
    }
    idxs = indeces(res, "sin")
    for (let i = 0; i < idxs.length; i++) {
        let arg = normalize(res.slice(idxs[i]+3, closeB(res, idxs[i], 4)+1))
        res = res.replace(res.slice(idxs[i], closeB(res, idxs[i], 4)+1), `(${Math.sin(eval(arg.replaceAll("^", "**")))})`)
    }
    idxs = indeces(res, "tan")
    for (let i = 0; i < idxs.length; i++) {
        let arg = normalize(res.slice(idxs[i]+3, closeB(res, idxs[i], 4)+1))
        res = res.replace(res.slice(idxs[i], closeB(res, idxs[i], 4)+1), `(${Math.tan(eval(arg.replaceAll("^", "**")))})`)
    }
    idxs = indeces(res, "abs")
    for (let i = 0; i < idxs.length; i++) {
        let arg = normalize(res.slice(idxs[i]+3, closeB(res, idxs[i], 4)+1))
        res = res.replace(res.slice(idxs[i], closeB(res, idxs[i], 4)+1), `(${Math.abs(eval(arg.replaceAll("^", "**")))})`)
    }
    idxs = indeces(res, "sqrt")
    for (let i = 0; i < idxs.length; i++) {
        let arg = normalize(res.slice(idxs[i]+4, closeB(res, idxs[i], 5)+1))
        let val = eval(arg.replaceAll("^", "**"))
        res = val >= 0 ? res.replace(res.slice(idxs[i], closeB(res, idxs[i], 5)+1), `(${Math.sqrt(eval(arg.replaceAll("^", "**")))})`) : res = res
    }
    return res
}

function indeces(str, substr) {
    var indices = [];
    var index = str.indexOf(substr);
  
    while (index !== -1) {
      indices.push(index);
      index = str.indexOf(substr, index + 1);
    }
  
    return indices;
}

function closeB(str, idx, offset) {
    let open = 1
    for (let i = idx+offset; i < str.length; i++) {
        if (str[i] == '(') {
            open++
        } else if (str[i] == ')') {
            open--
        }
        if (open == 0) {
            return i
        }
    }
    return undefined
}

function DrawLines() {
    if (!dots) {
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
}

mL.addEventListener("wheel", (e) => {
    if (e.deltaY < 0 && zoomF < 10) {
        zoomF+=0.1
    } else if (zoomF > 0.2) {
        zoomF-=0.1
    }
    Update()
})
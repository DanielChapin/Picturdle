<script lang="ts">
  import Color from "color";
  import type { HTMLCanvasAttributes } from "svelte/elements";
  import Vector from "$lib/vector";
  
  enum Correctness {
    Fully, Partly, None
  }
  type Pixel = {
    correctness?: Correctness
    color: Color
  }
  type Board = Array<Array<Pixel>>

  function correctnessColor(c: Correctness | undefined): Color {
    switch (c) {
      case Correctness.Fully: return Color.rgb(69, 255, 96)
      case Correctness.Partly: return Color.rgb(241, 255, 69)
      case Correctness.None: return Color.rgb(255, 69, 69)
      default: return Color.rgb(0, 0, 0)
    }
  }

  function emptyTile(): Pixel {
    return {
      color: Color.rgb(255, 255, 255)
    }
  }

  type Props = {
    dimensions: Vector
    board?: Board
    tool?: "pencil" | "fill"
    zoom?: number
    centeredOn?: Vector
    scrollSensitivity?: number
    selectedColor?: Color
  } & HTMLCanvasAttributes
  let {
    dimensions,
    board: boardInit,
    tool = $bindable("pencil"),
    zoom,
    scrollSensitivity = 0.05,
    selectedColor = $bindable(Color.rgb(255, 0, 255)),
    centeredOn = new Vector(0.5, 0.5),
    ...props
  }: Props = $props();

  // Note, the Array(n) initializer DOES NOT have elements in it.
  // Therefore, to do a map, we need to initialize it with some arbitrary element.
  let board = boardInit ?? new Array(dimensions.i()).fill(null).map(() => new Array(dimensions.j()).fill(null).map(() => emptyTile()))

  let canvas: HTMLCanvasElement
  let lmbPressed: boolean = $state(false)
  let rmbPressed: boolean = $state(false)

  function pixel(indices: Vector): Pixel {
    return board[indices.y()][indices.x()]
  }

  function setColor(ctx: CanvasRenderingContext2D, color: Color) {
    ctx.strokeStyle = color.string()
    ctx.fillStyle = color.string()
  }

  function render(ctx: CanvasRenderingContext2D) {
    let gridSize = Math.floor(zoom!)
    let drawGrid = gridSize > 5
    let sizepx = canvas.getBoundingClientRect()

    ctx.resetTransform()
    setColor(ctx, Color.rgb(255, 255, 255))
    ctx.clearRect(0, 0, sizepx.width, sizepx.height)
    setColor(ctx, Color.rgb(0, 0, 0))

    ctx.translate(sizepx.width * 0.5, sizepx.height * 0.5)
    ctx.translate(gridSize * dimensions.x() * -centeredOn.x(), gridSize * dimensions.y() * -centeredOn.y())

    ctx.lineWidth = 1
    ctx.strokeRect(-1, -1, gridSize * dimensions.x() + 1, gridSize * dimensions.y() + 1)

    // TODO Culling tiles that are not within frame
    board.map((rowArr, row) => rowArr.map((pixel, col) => {
      let x = col * gridSize
      let y = row * gridSize
      let w = gridSize
      let h = gridSize

      setColor(ctx, pixel.color)
      ctx.fillRect(x, y, w, h)

      if (drawGrid) {
        ctx.lineWidth = 1
        setColor(ctx, Color.rgb(0, 0, 0))
        ctx.strokeRect(x, y, w, h)

        setColor(ctx, correctnessColor(pixel.correctness))
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
      }
    }))
  }

  function tryRender() {
    let ctx = canvas.getContext('2d')
    if (ctx) {
      render(ctx)
    }
  }

  function canvasSizePx(): Vector {
    let rect = canvas.getBoundingClientRect()
    return new Vector(rect.width, rect.height)
  }

  function gridSizePx(): Vector {
    return new Vector(zoom! * dimensions.x(), zoom! * dimensions.y())
  }

  function uv(vec: Vector): Vector {
    return vec.div(canvasSizePx()).sub(new Vector(0.5, 0.5))
  }

  function gridUV(vec: Vector): Vector {
    let size = canvasSizePx()
    let scale = size.div(gridSizePx())
    return vec.div(size).sub(new Vector(0.5, 0.5)).mult(scale)
  }

  function gridUVtoIndices(gridUV: Vector): Vector | undefined {
    let raw = gridUV.add(new Vector(0.5, 0.5)).mult(dimensions).map(Math.floor)
    if (raw.x() < 0 || raw.x() >= dimensions.x() || raw.y() < 0 || raw.y() >= dimensions.y()) {
      return undefined
    }
    return raw
  }

  function onScroll(event: WheelEvent) {
    let deltaZoom = -scrollSensitivity * event.deltaY

    zoom = Math.max(0, zoom! + deltaZoom)

    // TODO Should zooming move the center point? (Below example of roughly how that would work)
    // let rect = canvas.getBoundingClientRect()
    // let posUV = new Vector(event.clientX / rect.width, event.clientY / rect.height).sub(new Vector(0.5, 0.5))
    // centeredOn = centeredOn.add(posUV).clamp(Vector.origin(3), Vector.repeated(1, 3))
  }

  function mouseDown(event: MouseEvent) {
    event.preventDefault()
    switch (event.button) {
      case 0: // LMB
        lmbPressed = true
        break
      case 2: // RMB
        rmbPressed = true
        break
    }
  }

  function mouseUp(event: MouseEvent) {
    event.preventDefault()
    switch (event.button) {
      case 0: // LMB
        lmbPressed = false
        break
      case 2: // RMB
        rmbPressed = false
        break
    }
  }

  function mouseMove(event: MouseEvent) {
    if (!lmbPressed && !rmbPressed) {
      return
    }

    let clientPos = new Vector(event.clientX, event.clientY)
    let posUV = uv(clientPos)
    let posGrid = gridUV(clientPos)
    let gridIndices = gridUVtoIndices(posGrid)

    if (lmbPressed && gridIndices) {
      draw(gridIndices)
    }
  }

  function draw(indices: Vector) {
    pixel(indices).color = selectedColor
    tryRender()
  }

  $effect(() => {
    console.log(board);
    let heightActual = board.length;
    if (heightActual == 0) {
      console.warn("Zero sized GuessCanvas.")
      return
    }

    let widthActual = board[0].length;
    if (board.find(row => row.length != widthActual)) {
      console.warn("Inconsistent GuessCanvas row length")
    }

    if (widthActual != dimensions.x() || heightActual != dimensions.y()) {
      console.warn("Inconsistent GuessCanvas dimensions compared to board.")
    }
  })

  $effect(() => {
    let ctx = canvas.getContext('2d');
    if (ctx) {
      render(ctx);
    }
  });

  $effect(() => {
    if (zoom == undefined) {
      let rect = canvas.getBoundingClientRect()
      let idealX = rect.width / dimensions.x()
      let idealY = rect.height / dimensions.y()
      zoom = Math.min(idealX, idealY)
    }

    tryRender()
  })
</script>

<canvas class={`border ${rmbPressed ? 'cursor-move' : 'cursor-crosshair'}`} bind:this={canvas} onwheel={onScroll} onmousedown={mouseDown} onmouseup={mouseUp} onmousemove={mouseMove} onmouseleave={() => {lmbPressed = false; rmbPressed = false}} oncontextmenu={(e) => e.preventDefault()} {...props}></canvas>
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

  let canvas: HTMLCanvasElement;
  let mousePressed: boolean = false;

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

  function onScroll(event: WheelEvent) {
    let deltaZoom = -scrollSensitivity * event.deltaY

    zoom = Math.max(0, zoom! + deltaZoom)

    // TODO Should zooming move the center point? (Below example of roughly how that would work)
    // let rect = canvas.getBoundingClientRect()
    // let posUV = new Vector(event.clientX / rect.width, event.clientY / rect.height).sub(new Vector(0.5, 0.5))
    // centeredOn = centeredOn.add(posUV).clamp(Vector.origin(3), Vector.repeated(1, 3))
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

<canvas class="border cursor-crosshair" bind:this={canvas} onwheel={onScroll} {...props}></canvas>
class Vector {
  vec: Array<number>;

  constructor(...nums: number[]) {
    this.vec = nums;
  }

  static fromArray(array: number[]): Vector {
    return new Vector(...array);
  }

  static repeated(num: number, dimensions: number): Vector {
    return Vector.fromArray(new Array(dimensions).fill(num));
  }

  static origin(dimensions: number = 3): Vector {
    return Vector.repeated(0, dimensions);
  }

  toArray(): number[] {
    return this.vec;
  }

  x(): number {
    return this.vec[0];
  }

  y(): number {
    return this.vec[1];
  }

  z(): number {
    return this.vec[2];
  }

  i(): number {
    return this.vec[0];
  }

  j(): number {
    return this.vec[1];
  }

  k(): number {
    return this.vec[2];
  }

  nth(n: number): number {
    return this.vec[n];
  }

  at(n: number): number | undefined {
    return this.vec.at(n);
  }

  mul(v: Vector): Vector {
    return this.zipWith(v, (l, r) => l * r);
  }

  div(v: Vector): Vector {
    return this.zipWith(v, (l, r) => l / r);
  }

  add(v: Vector): Vector {
    return this.zipWith(v, (l, r) => l + r);
  }

  sub(v: Vector): Vector {
    return this.zipWith(v, (l, r) => l - r);
  }

  clamp(lo: Vector, hi: Vector): Vector {
    return this.zipWith(lo, Math.max).zipWith(hi, Math.min);
  }

  scale(f: number): Vector {
    return this.map((n) => n * f);
  }

  dot(v: Vector): number {
    return this.mul(v).reduce((n, acc) => acc + n);
  }

  magnitude(): number {
    return Math.sqrt(this.dot(this));
  }

  equals(other: Vector): boolean {
    return this.sub(other).all((n) => n == 0);
  }

  zipWith(that: Vector, combiner: (l: number, r: number) => number): Vector {
    let a = this.vec.at(0);
    let b = that.vec.at(0);

    let i = 0;
    let result = new Vector();
    while (a !== undefined || b !== undefined) {
      result.vec.push(combiner(a ?? 0, b ?? 0));

      i += 1;
      a = this.vec.at(i);
      b = that.vec.at(i);
    }
    return result;
  }

  any(predicate: (n: number) => boolean): boolean {
    return this.vec.some(predicate);
  }

  all(predicate: (n: number) => boolean): boolean {
    return this.vec.every(predicate);
  }

  fold<T>(reducer: (n: number, acc: T) => T, init: T): T {
    let result = init;
    this.vec.forEach((n) => (result = reducer(n, result)));
    return result;
  }

  reduce(reducer: (n: number, acc: number) => number): number {
    return this.fold(reducer, 0);
  }

  map(mapper: (n: number) => number): Vector {
    return Vector.fromArray(this.vec.map(mapper));
  }

  size(): number {
    return this.vec.length;
  }
}

export default Vector;

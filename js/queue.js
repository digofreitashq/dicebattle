class Queue {
  constructor() {
    this.elements = {};
    this.head = 0;
    this.tail = 0;
  }
  enqueue(element) {
    this.elements[this.tail] = element;
    this.tail++;
  }
  dequeue() {
    const item = this.elements[this.head];
    delete this.elements[this.head];
    this.head++;
    return item;
  }
  peek() {
    return this.elements[this.head];
  }
  get length() {
    return this.tail - this.head;
  }
  get isEmpty() {
    return this.length === 0;
  }
}

class QueueManager {
  constructor(interval) {
    this.queue = new Queue();
    this.interval = interval;
    queueRunner(this);
  }
  put(element) {
    this.queue.enqueue(element);
  }
  get length() {
    return this.queue.length;
  }
  get isEmpty() {
    return this.queue.isEmpty;
  }
}

function queueRunner(manager) {
  setTimeout(queueRunner, manager.interval, manager);
  if (manager.queue.isEmpty) return;

  try {
    var item = manager.queue.dequeue();
    if (typeof item == "undefined") return;
    item[0](...item[1]);
  } catch (e) {
    console.log(item);
    console.log(e);
  }
}
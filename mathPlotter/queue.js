class TFQueue 
{
    constructor(size) 
    {
        this.size   = size;
        this.buffer = new Array(size);
        this.start  = 0;
        this.end    = 0;
        this.isFull = false;
    }

    push(item) 
    {
        this.buffer[this.end] = item;
        this.end              = this.end + 1;

        if (this.end >= this.size) this.end = 0;
        
        if (this.isFull) 
        {
           this.start = this.start + 1;

           if (this.start >= this.size)  this.start = 0;
        }

        if (this.end === this.start)  this.isFull = true;
    }

    pop() 
    {
        if (this.isEmpty()) throw new Error("Buffer is empty");
    
        const item = this.buffer[this.start];
        this.start = this.start + 1;

        if (this.start >= this.size) this.start = 0;
    
        this.isFull = false;

        return item;
    }

    isEmpty() 
    {
       return (!this.isFull && this.start === this.end);
    }

    hasData() 
    {
        return !this.isEmpty();
    }

    getData() 
    {
        if (this.isEmpty()) return [];
        
        if (this.start < this.end) return this.buffer.slice(this.start, this.end);
        else                       return this.buffer.slice(this.start).concat(this.buffer.slice(0, this.end));
    }
}

module.exports.TFQueue = TFQueue;

export interface Filter {
    Filter : {
        orderBy : string, //published / title / enabled
        order : string,
        amount : number,
        enabled : 0 | 1 ,
        schema : string
    }
}
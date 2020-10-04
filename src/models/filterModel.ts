export interface Filter {
    Filter : {
        orderBy : string | "published" | "title" | "enabled",
        order : string | "asc" | "desc",
        amount : number,
        enabled : 0 | 1 ,
        schema : string | "moviedb"
    }
}
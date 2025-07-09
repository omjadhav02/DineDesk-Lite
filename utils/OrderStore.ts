let placedOrders: any [] = [];

export const addOrder = (order: any)=>{
    placedOrders.unshift(order);
}
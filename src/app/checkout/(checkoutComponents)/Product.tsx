'use client'

import Image from "next/image";


interface Props {
  items: any;
}


function CheckoutProduct({ items }: Props) {
  return (
    <div className="flex flex-col gap-x-4 border-b border-black pb-5 lg:flex-row lg:items-center">
      <div className="relative h-44 w-44">
        <Image
          src={items?.image}
          alt={items?.title}
          layout="fill"
          objectFit="contain"
        />
      </div>

      <div className="flex flex-1 items-end lg:items-center">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-x-8 text-xl lg:flex-row lg:text-2xl">
            <h4 className="font-semibold lg:w-96">{items?.title}</h4>
            <p className="flex items-end gap-x-1 font-semibold">
              {items.length}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-4">
          <h4 className="text-xl font-semibold lg:text-2xl">
            ${items?.price * items?.quantity}
          </h4>
        </div>
      </div>
    </div>
  );
}

export default CheckoutProduct;
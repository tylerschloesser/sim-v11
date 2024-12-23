import React from 'react'

export const Button: React.FC<
  Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'className'
  >
> = (props) => {
  return (
    <button
      className="p-1 border border-white"
      {...props}
    />
  )
}

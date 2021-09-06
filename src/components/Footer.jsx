import React from 'react'
import { AiFillHeart } from 'react-icons/ai'

const Footer = () => {
  return (
    <footer className='footer footer-bar mt-5'>
      <div className='container text-center'>
        <div className='row align-items-center'>
          <div className='col-sm-6'>
            <div className='text-sm-start'>
              <p className='mb-0'>
                ©{new Date().getFullYear()} ANIR SPACE . Developed with
                <AiFillHeart className='mdi mdi-heart text-danger mx-4' />
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

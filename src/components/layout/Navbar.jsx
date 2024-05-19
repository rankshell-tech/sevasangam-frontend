import { Link } from 'react-router-dom'
import img from './../../assets/images/sevasangam-logo.jpg'
import Button from './../buttons/Button'
import SearchBar from '../searchBar/SearchBar'
import { useAuth } from '../../context/Auth'
import { useEffect } from 'react'



const Navbar = () => {

  const [auth] = useAuth();



  const logout = () => {

    localStorage.removeItem('auth')
    window.location.reload()

  }


  useEffect(() => {


  })
  return (



    <div className="nav-wrapper">
      <nav>
        <div className="nav-left">
          <div className="logo-container">
            <img src={img}></img>
          </div>
          <div className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Link to="/">Home</Link>
          </div>
          <div className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
            <Link to="/about">About Us</Link>
          </div>
          <div className={`nav-item ${location.pathname === '/temples' ? 'active' : ''}`}>
            <Link to="/temples">Temples</Link>
          </div>
          <div className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
        <div className="nav-right">

          <div className="nav-item">
            <SearchBar />
          </div>
          <div className="nav-item">
            <Button size='medium' type='primary' text='Donate Now' />
          </div>
          <div className="nav-item">
            {auth?.user ? (<button type="button" onClick={logout} className="btn btn-theme-primary">
              Log out
            </button>) : (<button type="button" className="btn btn-theme-primary" data-bs-toggle="modal" data-bs-target="#loginBackdrop">
              Sign Up / Login
            </button>)}


          </div>

          {auth?.user ? (
            <div className="nav-item dropup-center dropup">
              <button data-bs-toggle="dropdown" aria-expanded="false">
                <div className="d-flex align-items-center">
                  <div className='avatar-wrapper mx-2'>
                    <img src={auth.user.picture ? auth.user.picture : "https://i.pinimg.com/1200x/49/da/b2/49dab2d4d9be840f6aae7d575353cb48.jpg"} alt='avatar' />
                  </div>
                  <span><small>{(auth.user.name).toUpperCase()}</small></span>
                </div>
              </button>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/update-profile">
                    Profile
                  </Link>
                </li>
                {auth.user.role === 1 ? (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/admin/temples">
                        All Temples
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/add-temple">
                        Add New Temple
                      </Link>
                    </li>

                  </>
                ) : auth.user.role === 2 ? (
                  <>
                    <li>
                      <Link className="dropdown-item" to="/superadmin/temples">
                        Temples
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/superadmin/add-temple">
                        Add New Temple
                      </Link>
                    </li>

                    <li>
                      <Link className="dropdown-item" to="/superadmin/temple-listers">
                        Users
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/superadmin/donations">
                        Donations
                      </Link>
                    </li>

                  </>
                ) : (
                  // Default case, assuming auth.user.role === 0 
                  <>

                    <li>
                      <Link className="dropdown-item" to="/add-new-temple">
                        Past Donations
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/view-update-temples">
                        80G Certificates
                      </Link>
                    </li>
                  </>
                )}
              </ul>


            </div>
          ) : null
          }
        </div>
      </nav>
    </div>
  )
}

export default Navbar
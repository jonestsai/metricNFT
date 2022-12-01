import { useState } from 'react';
import { FloatingLabel, Form } from 'react-bootstrap';
import { URLS } from '../../Settings';

export default function Settings({ publicKey, email, setEmail }) {
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  
  const handleEmail = async (action, publicKey, email) => {
    const data = {
      wallet_address: publicKey,
      email: action === 'connect' ? email : null,
    };

    try {
      const response = await fetch(`${URLS.api}/users/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status >= 200 && response.status < 300) {
        if (action === 'connect') {
          setIsEmailSaved(true);
        }

        if (action === 'disconnect') {
          setEmail('');
          setIsEmailSaved(false);
        }
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      // Fail silently. This action is not important enough to interrupt the user's workflow.
      // alert('There was an issue saving. Please try again.');
    }
  }

  return (
    <div className="container-fluid py-5 px-sm-0">
      <div className="row justify-content-md-center">
        <div className="col-md-6">
          <FloatingLabel
            controlId="floatingInput"
            label="Email address"
            className="mb-3"
          >
            <Form.Control
              required
              type="email"
                value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </FloatingLabel>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 offset-md-3 d-flex justify-content-between">
          <button type="button" className="btn btn-primary" onClick={() => handleEmail('connect', publicKey, email)}>Save</button>
          {isEmailSaved && (
            <div className="text-success my-1">Saved!</div>
          )}
          <button type="button" className="btn btn-outline-danger" onClick={() => handleEmail('disconnect', publicKey, email)}>Disconnect Email</button>
          </div>
      </div>
    </div>
  );
}

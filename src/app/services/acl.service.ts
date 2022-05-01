import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class AclService {
  constructor(private http: HttpClient) {}

  geRACLlist() {
    //@TODO remover MOOCK quando  pegar com o DRAW/Rafa de onde vem os dados
    return this.http
      .get<any>('assets/roles.json')
      .toPromise()
      .then((res) => <any[]>res.data)
      .then((data) => {
        return data;
      });
  }
}
